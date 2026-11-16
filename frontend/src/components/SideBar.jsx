import{ useState, useEffect } from 'react'
import { Coins, LogOut, Menu, MessageSquare, PanelLeftIcon, PanelRight, PenSquare, Plus, User, X } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { getConversations } from '../features/getConversations'
import { addConversation, setConversations, setSelectedConversation, clearConversations } from '../redux/conversationSlice'
import { setUserdata } from '../redux/userSlice' 
import { createConversation } from '../features/createConversation'
import logOut from "../features/logOut.js"

function SideBar() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [imageError, setImageError] = useState(false)
    
    const dispatch = useDispatch()
    const { conversations, selectedConversation } = useSelector(state => state.conversation)
    const { userData } = useSelector(state => state.user)
    
    useEffect(() => {
        const getConv = async () => {
            if (!userData) return; 
            const data = await getConversations()
            dispatch(setConversations(data))
        }
        getConv()
    }, [dispatch, userData?._id]) 

    const handleCreateConversation = async () => {
        const data = await createConversation()
        dispatch(addConversation(data))
        dispatch(setSelectedConversation(data))
    }

    const handleLogout = async () => {
        try {
            await logOut(); 
            dispatch(setUserdata(null)); 
            dispatch(clearConversations()); 
        } catch (error) {
            console.error("Failed to logout frontend", error);
        }
    }

    const userImage = userData?.picture || userData?.avatar;

    if (collapsed) {
        return (
            <div className='hidden lg:flex flex-col items-center w-[60px] h-screen bg-[#07090e] border-r border-white/[0.06] py-4 gap-2 shrink-0 select-none'>
                <button 
                    className='flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-200 bg-transparent border-none cursor-pointer'
                    onClick={() => setCollapsed(false)}
                >
                    <PanelRight size={19} />
                </button>

                <button
                    className='flex items-center justify-center w-9 h-9 rounded-xl text-zinc-950 bg-linear-to-tr from-teal-400 to-cyan-300 hover:brightness-110 shadow-[0_0_15px_-3px_rgba(45,212,191,0.4)] transition-all duration-200 border-none cursor-pointer mt-1'
                    onClick={handleCreateConversation}
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>

                <div className='flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-4 w-full flex flex-col items-center gap-1'>
                    {conversations?.map((conv) => {
                        const isActive = selectedConversation?._id === conv?._id
                        return (
                            <div
                                key={conv._id}
                                onClick={() => dispatch(setSelectedConversation(conv))}
                                className={`flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl border transition-all duration-200
                                ${isActive 
                                    ? "bg-teal-500/15 border-teal-400/30 text-teal-300 shadow-[0_0_12px_-3px_rgba(45,212,191,0.25)]" 
                                    : "bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"}`}
                            >
                                <MessageSquare size={15} />
                            </div>
                        )
                    })}
                </div>

                <div className='relative shrink-0 mb-1'>
                    {(userImage && !imageError) ?
                        <img
                            className='w-9 h-9 rounded-xl object-cover ring-2 ring-teal-500/30 cursor-pointer hover:ring-teal-400 transition-all'
                            src={userImage}
                            alt={"profile"}
                            referrerPolicy="no-referrer"
                            onError={() => setImageError(true)} 
                        />
                        :
                        <div className='w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center'>
                            <User size={15} className="text-zinc-400" />
                        </div>
                    }
                </div>
            </div>
        )
    }

    return (
        <>
            <button 
                className='lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#07090e]/90 backdrop-blur-md border border-white/[0.08] text-zinc-400 hover:text-teal-300 transition-colors duration-150 cursor-pointer' 
                onClick={() => setMobileOpen(true)}
            >
                <Menu size={15} />
            </button>

            {mobileOpen && (
                <div 
                    onClick={() => setMobileOpen(false)} 
                    className='lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity' 
                />
            )}

            <div className={`fixed lg:static inset-y-0 left-0 z-50 w-[275px] h-screen shrink-0 bg-[#07090e] border-r border-white/[0.06] transition-transform duration-300 ease-out select-none ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className='flex flex-col h-full relative overflow-hidden'>
                    
                    {/* Subtle ambient top light effect */}
                    <div className='pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-teal-500/[0.07] rounded-full blur-3xl' />

                    {/* Header */}
                    <div className='flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.05] relative z-10'>
                        <button 
                            className='hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer'
                            onClick={() => setCollapsed(true)}
                        >
                            <PanelLeftIcon size={18} />
                        </button>

                        <button 
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className='flex items-center gap-2 flex-1'>
                            <span className='w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]' />
                            <span className='text-[16px] font-bold tracking-tight bg-linear-to-r from-white via-zinc-100 to-teal-200 bg-clip-text text-transparent'>
                                Lumina
                            </span>
                        </div>
                        
                        <button 
                            className='flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors duration-150 bg-transparent border-none cursor-pointer'
                            onClick={handleCreateConversation}
                        >
                            <PenSquare size={16} />
                        </button>
                    </div>

                    {/* New Chat CTA */}
                    <div className='px-4 pt-4 pb-2 relative z-10'>
                        <button 
                            className='w-full flex items-center justify-center gap-2 text-[13.5px] font-semibold text-zinc-950 bg-linear-to-r from-teal-400 via-teal-300 to-cyan-400 rounded-xl py-[10px] border-none cursor-pointer shadow-[0_0_20px_-5px_rgba(45,212,191,0.45)] hover:shadow-[0_0_25px_-3px_rgba(45,212,191,0.65)] hover:brightness-105 active:scale-[0.99] transition-all duration-200'
                            onClick={handleCreateConversation}
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            New Chat
                        </button>
                    </div>

                    {/* Section Label */}
                    <div className='px-5 pt-4 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500'>
                        {conversations?.length === 0 ? "No Recent Conversations" : "Recents"}
                    </div>

                    {/* Conversation List */}
                    <div className='flex-1 overflow-y-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-0.5 relative z-10'>
                        {conversations?.map((conv) => {
                            const isActive = selectedConversation?._id === conv?._id
                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => dispatch(setSelectedConversation(conv))}
                                    className={`group relative flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border transition-all duration-200
                                    ${isActive 
                                        ? "bg-linear-to-r from-teal-500/[0.12] to-cyan-500/[0.04] border-teal-500/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" 
                                        : "bg-transparent border-transparent hover:bg-white/[0.03]"}`}
                                >
                                    {/* Active left indicator bar */}
                                    {isActive && (
                                        <div className='absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]' />
                                    )}

                                    <div className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg transition-colors duration-200
                                        ${isActive 
                                            ? "bg-teal-400/15 text-teal-300" 
                                            : "bg-white/[0.04] text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/[0.06]"}`}
                                    >
                                        <MessageSquare size={13} />
                                    </div>

                                    <span className={`text-[13px] truncate transition-colors duration-200 ${isActive ? "font-semibold text-white" : "font-medium text-zinc-400 group-hover:text-zinc-200"}`}>
                                        {conv?.title || "New Chat"}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer / User Profile */}
                    <div className='mx-3 h-px bg-linear-to-r from-transparent via-white/[0.07] to-transparent' />
                    <div className='p-3 relative z-10'>
                        {userData ? (
                            <div className='flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all duration-200'>
                                <div className='relative shrink-0'>
                                    {(userImage && !imageError) ?
                                        <img
                                            className='w-9 h-9 rounded-xl object-cover ring-2 ring-teal-500/30'
                                            src={userImage}
                                            alt={"image"}
                                            referrerPolicy="no-referrer"
                                            onError={() => setImageError(true)} 
                                        />
                                        :
                                        <div className='w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center'>
                                            <User size={15} className="text-teal-300" />
                                        </div>
                                    }
                                </div>

                                <div className='flex-1 min-w-0'>
                                    <p className='text-[13px] font-semibold text-zinc-100 truncate'>
                                        {userData?.name || "User"}
                                    </p>
                                    <p className='text-[10.5px] font-medium text-teal-400/80 uppercase tracking-wider mt-0.5'>
                                        {userData?.plan || "Free plan"}
                                    </p>
                                </div>

                                <div className='flex items-center gap-1'>
                                    <button 
                                        title="Credits & Billing"
                                        className='flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-amber-400/80 cursor-pointer hover:bg-amber-500/15 hover:text-amber-300 transition-all duration-150'
                                    >
                                        <Coins size={17} />
                                    </button>
                                    <button 
                                        title="Log Out"
                                        className='flex items-center justify-center w-7 h-7 rounded-lg border-none bg-transparent text-zinc-500 cursor-pointer hover:bg-rose-500/15 hover:text-rose-400 transition-all duration-150'
                                        onClick={handleLogout} 
                                    >
                                        <LogOut size={17} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className='w-full flex items-center justify-center gap-2 text-sm font-medium text-zinc-200 bg-white/[0.04] border border-white/[0.08] rounded-xl py-[11px] cursor-pointer hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-200 transition-all duration-200'>
                                Login
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </>
    )
}

export default SideBar