import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from "motion/react"
import { Coins, Crown, Sparkles, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { createOrder } from '../features/createOrder'
import { verifyPayment } from '../features/verifyPayment'
import { setUserdata } from '../redux/userSlice'
import api from '../utils/axios'

function BillingDrawer({ open, onClose }) {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const [verifying, setVerifying] = useState(false)

    const handleUpgrade = async (plan) => {
        try {
            const data = await createOrder(plan)
            if (!data?.order?.id) return

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Lumina",
                description: `${data.plan?.name} Plan`,
                order_id: data.order.id,
                handler: async (response) => {
                    try {
                        setVerifying(true)
                        await verifyPayment(response)
                        const { data: me } = await api.get("/api/me")
                        dispatch(setUserdata(me?.user || me))
                        onClose()
                    } catch (error) {
                        console.error(error)
                    } finally {
                        setVerifying(false)
                    }
                },
                theme: {
                    color: "#0D9488"
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.error(error)
        }
    }

    if (typeof document === "undefined") return null

    const credits = userData?.credits || 0
    const totalCredits = userData?.totalCredits || 100
    const progressPercent = Math.min(100, Math.max(0, (credits / totalCredits) * 100))

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed right-0 top-0 z-[70] h-screen w-full max-w-[390px] bg-[#07090e] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden select-none antialiased"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                                    <span className="text-lg font-bold tracking-tight bg-linear-to-r from-white via-zinc-100 to-teal-200 bg-clip-text text-transparent">
                                        Lumina Billing
                                    </span>
                                </div>
                                <div className="text-zinc-400 text-xs mt-0.5">
                                    {verifying ? "Verifying payment..." : "Manage your plan & generation credits"}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-teal-500/10 hover:border-teal-500/30 text-zinc-400 hover:text-teal-300 flex items-center justify-center transition-all duration-150 cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-2xl bg-gradient-to-br from-teal-500/[0.1] via-white/[0.03] to-cyan-500/[0.04] border border-teal-500/20 p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
                                            Current Plan
                                        </p>
                                        <h3 className="text-white text-xl font-bold capitalize mt-0.5">
                                            {userData?.plan || "free"}
                                        </h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                                        <Crown size={19} className="text-amber-400" />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <div className="flex justify-between text-xs text-zinc-400 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <Coins size={13} className="text-teal-400" />
                                            Available Credits
                                        </span>
                                        <span className="font-semibold text-zinc-200">
                                            {credits} / {totalCredits}
                                        </span>
                                    </div>

                                    <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-6 flex-1 overflow-y-auto space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-teal-500/30 p-4 transition-all duration-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-100 font-semibold">Starter Plan</h3>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2.5 py-0.5 rounded-full">
                                        500 Credits
                                    </span>
                                </div>
                                <p className="text-teal-300 text-2xl font-bold mt-2">₹199</p>
                                <button
                                    disabled={verifying}
                                    className="mt-4 w-full rounded-xl bg-white/[0.05] border border-teal-500/30 hover:bg-teal-500/15 disabled:opacity-50 text-teal-200 font-semibold text-sm py-2.5 transition-all duration-200 cursor-pointer"
                                    onClick={() => handleUpgrade("starter")}
                                >
                                    Upgrade to Starter
                                </button>
                            </div>

                            <div className="rounded-2xl bg-linear-to-b from-teal-500/[0.09] to-white/[0.02] border border-teal-400/35 p-4 transition-all duration-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-semibold flex items-center gap-1.5">
                                        Pro Plan
                                        <Sparkles size={14} className="text-teal-300" />
                                    </h3>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-950 bg-linear-to-r from-teal-400 to-cyan-300 px-2.5 py-0.5 rounded-full">
                                        1000 Credits
                                    </span>
                                </div>
                                <p className="text-white text-2xl font-bold mt-2">₹499</p>
                                <button
                                    disabled={verifying}
                                    className="mt-4 w-full rounded-xl text-zinc-950 font-semibold text-sm bg-linear-to-r from-teal-400 via-teal-300 to-cyan-400 py-2.5 disabled:opacity-50 hover:brightness-105 transition-all duration-200 cursor-pointer"
                                    onClick={() => handleUpgrade("pro")}
                                >
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default BillingDrawer