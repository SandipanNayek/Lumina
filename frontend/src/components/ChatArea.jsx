import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

function ChatArea({ artifactOpen, onToggleArtifact, onSelectArtifact }) {
  const selectedConversation = useSelector((state) => state.conversation?.selectedConversation)
  const dispatch = useDispatch()

  useEffect(() => {
    const getMesg = async () => {
      if (!selectedConversation?._id) {
        dispatch(setMessages([]))
        dispatch(setArtifacts([]))
        return
      }
      const data = await getMessages(selectedConversation._id)
      const safeMessages = Array.isArray(data) ? data : []
      dispatch(setMessages(safeMessages))

      const latestWithArtifacts = [...safeMessages]
        .reverse()
        .find((m) => Array.isArray(m.artifacts) && m.artifacts.length > 0)
      dispatch(setArtifacts(latestWithArtifacts ? latestWithArtifacts.artifacts : []))
    }
    getMesg()
  }, [selectedConversation?._id, dispatch])

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#07090e] antialiased">
      <Nav
        artifactOpen={artifactOpen}
        onToggleArtifact={onToggleArtifact}
      />
      <MessageList onOpenArtifact={onSelectArtifact} />
      <ChatInput />
    </div>
  )
}

export default ChatArea