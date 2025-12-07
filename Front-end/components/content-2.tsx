import { Cpu, Zap } from 'lucide-react'
import Image from 'next/image'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">A Platform You Can Trust.</h2>
                <div className="relative">
                    <div className="relative z-10 space-y-4 md:w-1/2">
                        <p>
                            Sawtak provides a secure and resilient platform for anonymous reporting. <span className="font-medium">We leverage the power of blockchain</span> to ensure data integrity and provide cryptographic guarantees of submission proof.
                        </p>
                        <p>Our dual submission system allows you to choose the level of anonymity that suits your needs, while our public transparency portal allows anyone to audit the complaints submitted to the platform.</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Dual Submission Modes</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Choose between fully anonymous submission on the blockchain or an identified submission to our secure database.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Blockchain Transparency</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">All anonymous complaints are stored on the Hedera Consensus Service, providing an immutable audit trail.</p>
                            </div>
                        </div>
                    </div>
                    <div className="md:mask-l-from-35% md:mask-l-to-55% mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
                        <div className="border-border/50 relative rounded-2xl border border-dotted p-2">
                            <Image
                                src="https://images.unsplash.com/photo-1579567765586-ef6b1399f578?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                className="rounded-[12px] shadow"
                                alt="Data and analytics"
                                width={1207}
                                height={929}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
