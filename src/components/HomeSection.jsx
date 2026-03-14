import { MoveRight, FileText } from "lucide-react"; // Ícones mais técnicos
import { useTranslation } from "react-i18next";

export const HomeSection = () => {
    const { t } = useTranslation();

    return (
        <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-background overflow-hidden">
            
            {/* Elemento Decorativo: Blueprint */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="container max-w-5xl mx-auto text-center z-10">
                <div className="space-y-6 md:space-y-8">
                    
                    {/* Badge de Status */}
                    <div className="opacity-0 animate-fade-in flex justify-center mb-4">
                        <span className="px-3 py-1 border border-primary/30 text-primary font-mono text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase rounded-sm bg-primary/5">
                            System.Ready_v2.0
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-mono tracking-tighter uppercase leading-none">
                        <span className="opacity-0 animate-fade-in block text-muted-foreground text-2xl md:text-3xl mb-2 font-light">
                            {t("home.greetingPrefix")}
                        </span>
                        <span className="text-primary opacity-0 animate-fade-in-delay-1 inline-block">
                            {t("home.firstName")}
                        </span>
                        <span className="opacity-0 animate-fade-in-delay-2 inline-block ml-4 font-black italic">
                            {t("home.lastName")}
                        </span>
                    </h1>

                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent hidden md:block" />
                        <p className="text-lg md:text-xl text-muted-foreground font-mono leading-relaxed opacity-0 animate-fade-in-delay-3 px-4">
                            <span className="text-primary mr-2">&gt;</span>
                            {t("home.intro")}
                            <span className="inline-block w-2 h-5 bg-primary ml-2 animate-pulse align-middle" />
                        </p>
                    </div>

                    {/* Tags e BOTÕES DE AÇÃO */}
                    <div className="space-y-10 opacity-0 animate-fade-in-delay-3 pt-4">
                        <div className="flex flex-wrap justify-center gap-6">
                            {['Robotics', 'Automation', 'Software'].map((tag) => (
                                <span key={tag} className="text-[10px] font-mono text-muted-foreground/60 tracking-widest uppercase">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* NOVOS BOTÕES NA HOME */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <a 
                                href="#contact" 
                                className="group flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground font-mono text-xs tracking-[0.2em] uppercase hover:bg-primary/90 transition-all"
                            >
                                <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                {t("about.contact")}
                            </a>

                            <a 
                                href="/CV.pdf" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-8 py-3 border border-border text-foreground font-mono text-xs tracking-[0.2em] uppercase hover:border-primary transition-all"
                            >
                                <FileText size={14} className="opacity-50 group-hover:text-primary transition-colors" />
                                [ {t("about.cv")} ]
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};