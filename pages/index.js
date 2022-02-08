import { useRouter } from "next/router"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { currentTermSlugState, termsState } from "atoms/dictionary"
import Term from "components/Term"
import TermList from "components/TermList"
import Footer from "components/Footer"
import Header from "components/Header"

/**
 * Sort by title property 
 */
const titleSort = (a, b) => {
   if (a.title < b.title) return -1
   if (b.title < a.title) return 1
   return 0
}

/**
 * Find search query in term titles 
 */
const titleSearch = (search, terms) => terms.filter(term =>
   term.title.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
   term.description.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
   term.slug.toLowerCase().indexOf(search.toLowerCase()) > -1
).sort(titleSort)

export default function Home() {

   // Access router
   const router = useRouter()

   // Shared state
   const terms = useRecoilValue(termsState)

   // Local state 
   const searchRef = useRef(null)
   const [showTerm, setShowTerm] = useState(false)
   const [searchTerm, setSearchTerm] = useState('')
   const [keyToggle, setKeyToggle] = useState(false)
   const [currentTermIndex, setCurrentTermIndex] = useState(null)
   const filteredTerms = useMemo(() => terms?.length > 0 ? (searchTerm?.length > 0 ? titleSearch(searchTerm, terms) : [...terms].sort(titleSort)) : [], [searchTerm])
   const currentTerm = useMemo(() => currentTermIndex !== null ? filteredTerms[currentTermIndex] : null, [currentTermIndex])

   /**
    * Term navigation 
    */
   const onPrev = () => showTerm && setCurrentTermIndex((currentTermIndex - 1) < 0 ? (terms.length - 1) : (currentTermIndex - 1))
   const onNext = () => showTerm && setCurrentTermIndex((currentTermIndex + 1) >= terms.length ? 0 : (currentTermIndex + 1))

   // On slug change
   useEffect(() => {
      if (currentTermSlug) {
         setCurrentTermIndex(filteredTerms.findIndex(term => term.slug === currentTermSlug))
      }
   }, [currentTermSlug])

   // Handle keyboard input 
   function handleKeyInput(e) {
      if (e.key === 'ArrowLeft') {
         onPrev()
         e.preventDefault()
      }
      if (e.key === 'ArrowRight') {
         onNext()
         e.preventDefault()
      }
      if (e.key === 'Escape') {
         setShowTerm(false)
         e.preventDefault()
      }
      if (e.key === '/') {
         searchRef.current.focus()
         e.preventDefault()
      }
      setKeyToggle(!keyToggle)
   }

   /**
    * Load term on page load if we have a query param
    */
   useEffect(() => {
      if (router.query.term) {
         const matchedIndex = terms.findIndex((term) => term.slug === router.query.term)
         if (matchedIndex) setCurrentTermSlug(terms[matchedIndex].slug)
      }
   }, [router])

   /**
    * Rewrite URL on term change 
    */
   useEffect(() => {
      if (currentTerm && !showTerm) setShowTerm(true)
      router.push(currentTerm ? { pathname: '/', query: { term: currentTerm.slug } } : '/', undefined)
   }, [showTerm])

   /**
    * Detect key presses
    */
   useEffect(() => {
      window.addEventListener("keydown", handleKeyInput)
      return () => {
         window.removeEventListener("keydown", handleKeyInput)
      };
   }, [showTerm, keyToggle])

   /**
    * Select term by slug 
    */
   const selectTermBySlug = (slug) => {
      const matchingIndex = terms.findIndex((term) => term.slug === slug)
      if(matchingIndex >= 0) { 
         setCurrentTermIndex(matchingIndex)
         setShowTerm(true)
      }
   }

   return (

      <>

         {/* Active term */}
         <Term
            {...currentTerm}
            isOpen={showTerm}
            onClose={() => setShowTerm(false)}
            onNext={onNext}
            onPrev={onPrev}
            onSelectTermSlug={selectTermBySlug}
         />

         <div className="min-h-screen lg:h-screen flex flex-col">

            {/* Header */}
            <Header searchTerm={searchTerm} searchRef={searchRef} setSearchTerm={setSearchTerm} />

            {/* Main content */}
            <TermList terms={filteredTerms} isShowingTerm={showTerm} onSelectTermSlug={selectTermBySlug} />

            {/* Footer */}
            <Footer />

         </div>

      </>
   )
}
