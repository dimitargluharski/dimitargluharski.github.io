import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getUsername, saveUsername } from '../lib/userStore'

type LoginPageProps = {
  isDarkMode: boolean
}

export const LoginPage = ({ isDarkMode }: LoginPageProps) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const storedName = await getUsername()

        if (storedName) {
          setName(storedName)
        }
      } catch {
        setError('Не успяхме да заредим записания потребител.')
      }
    }

    void loadSavedUser()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedName = name.trim()

    if (!normalizedName) {
      setError('Моля, въведи име.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await saveUsername(normalizedName)
      navigate('/catalog')
    } catch {
      setError('Възникна проблем при запис в IndexedDB.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className={`w-full max-w-md rounded-xl border p-6 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}
      >
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Вход</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Въведи име, което ще пазим локално до backend интеграцията.
        </p>

        <label className={`mt-6 block text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} htmlFor="username">
          Име
        </label>
        <input
          id="username"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={`mt-2 w-full rounded-md border px-3 py-2 outline-none ${isDarkMode ? 'border-slate-600 bg-slate-900 text-slate-100 focus:border-slate-500' : 'border-slate-300 text-slate-900 focus:border-slate-400'}`}
          placeholder="Напр. Albatros"
          autoComplete="off"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSaving ? 'Записваме...' : 'Продължи'}
        </button>
      </form>
    </main>
  )
}
