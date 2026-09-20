import wordmark from '../../assets/wordmark.png'
import wordmarkDark from '../../assets/wordmark-dark.png'

export default function App() {
    return (
        <>
            <div className="w-75 justify-self-center">
                <img className="hidden dark:flex" src={wordmark} />
                <img className="flex dark:hidden" src={wordmarkDark} />
            </div>
        </>
    )
}