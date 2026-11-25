import fs from "fs"
import {PDFParse} from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorScore } from "../config/vectorDb.js";
import { getModel } from "../config/llmmodel.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const pdfRag = async (state) => {
    try {
         const buffer =  fs.readFileSync(state.file.path)
        const pdf =  new PDFParse({
            data:buffer
        })
        const result = await pdf.getText()
        const text = result.text

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize:1000,
            chunkOverlap:300
        })
        const docs = splitter.createDocuments([text])
        const collectionName = `pdf-${Date.now()}`

        const store =  await vectorScore(docs , collectionName)
        const releventDocs = await store.similaritySearch(state.prompt , 5)
        const context = releventDocs.map(d => d.pageContent).join("/n/n")

        const llm = await getModel("pdf-rag")


const messages = [
    new SystemMessage(
        `You are Lumina PDF Analysis Agent.

Rules:
- Answer the user's question using ONLY the provided PDF context below.
- If the answer cannot be found in the context, clearly say: "The uploaded PDF does not contain information about this."
- Preserve exact numbers, dates, names, and technical terms from the document.
- If the user asks for a summary, organize the key points clearly.
- Use clean Markdown (bullet points, bold text, headings, or tables) when helpful.
- Do not hallucinate or use outside assumptions.

PDF Context:
${context}`
    ),
    new HumanMessage(state.prompt || "Summarize the key points of this PDF document.")
]

        const response = llm.invoke(messages)
        return {
            ...state,
            aiResponse:response.content
        }


    } catch (error) {
        console.log(error)
        return{
            ...state,
            aiResponse:"Failed to Analyze pdf"
        }
    }
    finally{
        fs.unlinkSync(state.file.path)
    }
}