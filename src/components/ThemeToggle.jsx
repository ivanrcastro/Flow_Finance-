import { useEffect, useState } from "react";
import Dark_mode from "../assets/dark_mode.png";
import Light_mode from "../assets/light_mode.png";
import { cn } from "../lib/utils";

export const ThemeToggle = ({ className = "" }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            localStorage.setItem("theme", "light");
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setIsDarkMode(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "rounded-full transition-colors duration-300 focus:outline-hidden",
                className
            )}
        >
            {isDarkMode ? (
                <img src={Light_mode} alt="light_mode" className="h-5 w-auto" />
            ) : (
                <img src={Dark_mode} alt="dark_mode" className="h-4 w-auto" />
            )}
        </button>
    );
};