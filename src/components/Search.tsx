import styles from '@/components/Search.module.css'

export interface SearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  placeholder?: string
  buttonText?: string
}

export default function Search(props: SearchProps) {
  const {
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    buttonText = 'Search',
  } = props

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
      />
      <button className={styles.button} onClick={onSearch}>
        {buttonText}
      </button>
    </div>
  )
}
