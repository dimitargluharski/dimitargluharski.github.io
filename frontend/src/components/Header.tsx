import { useEffect, useState } from "react";
import { getUsername } from "../lib/userStore";

type HeaderProps = {
  isDarkMode: boolean
}

export const Header = ({ isDarkMode }: HeaderProps) => {
  const [username, setUsername] = useState("guest")

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedUsername = await getUsername()

        if (storedUsername) {
          setUsername(storedUsername)
        }
      } catch {
        setUsername("guest")
      }
    }

    void loadUsername()
  }, [])

  return (
    <header className={`w-full px-4 py-3 flex items-center justify-between border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
      <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
        Welcome, {username}!
      </span>
    </header>
  )
};