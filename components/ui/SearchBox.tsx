import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
}

// keep internal state to avoid parent rerenders; defer updates
const SearchBox: React.FC<SearchBoxProps> = React.memo(({ value, onChange }) => {
  const [local, setLocal] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  React.useEffect(() => {
    const timer = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(timer)
  }, [local, onChange])

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        ref={inputRef}
        placeholder="Buscar por ocupación, departamento o nombre..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-10 pr-10 bg-gray-900 border-gray-700 focus:ring-indigo-500 text-white"
      />
      {local && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          onClick={() => {
            setLocal("")
            inputRef.current?.focus()
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})

SearchBox.displayName = "SearchBox"
export default SearchBox
