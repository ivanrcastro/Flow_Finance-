import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => {
    return twMerge(clsx(inputs));
}

// Função utilitária para combinar classes Tailwind de forma limpa e legível.
// Permite organizar classes em várias linhas e, quando necessário, gerir classes condicionais e resolver conflitos entre classes Tailwind.
