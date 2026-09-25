import React from 'react'
import { ArrowRight } from 'lucide-react'
import { CardFront } from './cardArt.jsx'

/* THE MAKING OF COMMON ROOM — a case study page for the portfolio (route: /making-of). */

const SPEC = [
  { family: 'reader', actions: ['stacks-fiction', 'stacks-poetry', 'index-021', 'stacks-essay'], secrets: ['borrower'], name: 'Amina Okafor', number: 'NQ 028 417' },
  { family: 'maker', actions: ['workshop-align', 'workshop-ink', 'quarter-market', 'workshop-stock'], secrets: ['imperfection'], name: 'Luc Tremblay', number: 'NQ 347 190' },
  { family: 'seeker', actions: ['index-021', 'index-114', 'stacks-essay', 'index-403', 'workshop-stock'], secrets: ['curiosity'], name: 'Mei Nguyen', number: 'NQ 618 320' },
  { family: 'local', actions: ['quarter-market', 'quarter-river', 'stacks-fiction'], secrets: ['before'], name: 'Sami Haddad', number: 'NQ 271 904' },
]
const owner = (s) => ({ name: s.name, number: s.number, issued: '24 SEP 2026', signature: [] })

const ANATOMY = [
  ['Edge notches', 'A McBee Keysort code. Each of the 16 top holes stands for one possible mark; the ones you made are cut open to the edge. The accession number is notched in binary along the bottom.'],
  ['The window', 'One asymmetric cut, shared by every card. Behind it: the family’s material and the rosette.'],
  ['Accession rosette', 'A guilloche drawn from the visitor’s own marks, in the order they were made. Hidden traces add gilt stars. No two visits produce the same one.'],
  ['Tipped-in ephemera', 'Each hidden trace arrives as an object: a 1978 borrower’s card, a kept misprint, an NQ.000 slip, a 1963 postmark.'],
  ['Stamps and tally', 'The accession stamp lands once, on the day the card is earned. Later visits add a RENEWED stamp, the card slowly wears, and a librarian’s graphite tally counts the marks.'],
  ['The back', 'A barcode, a date-registered slip with one stamp per mark, and a QR code that leads back to the same card online.'],
]

const REFERENCES = [
  ['Edge-notched cards', 'McBee Keysort, 1930s–1970s'],
  ['Security guilloche', 'banknotes, passports, share certificates'],
  ['Book cloth, marbled endpapers, ex libris', 'READER'],
  ['Letterpress proofs, registration marks, colour bars', 'MAKER'],
  ['Catalogue cards, cyanotypes, typewriters', 'SEEKER'],
  ['Transit passes, engraved civic plans', 'LOCAL'],
  ['Date-due slips, card pockets, accession stamps', 'every card'],
]

function Figure({ src, caption, className = '' }) {
  return (
    <figure className={`mo-figure ${className}`}>
      <img src={src} alt={caption} loading="lazy" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

export default function MakingOf({ navigate }) {
  return (
    <main className="mo">
      <header className="mo-top">
        <button className="mo-brand" onClick={() => navigate('/')}>COMMON ROOM</button>
        <span>THE MAKING OF · DAY 17 / 30 DAYS OF REAL BUSINESS PROBLEMS</span>
      </header>

      <section className="mo-hero">
        <span className="mo-kicker">CASE STUDY</span>
        <h1>A library card you <em>accumulate</em>,<br />not one you receive.</h1>
        <p>Most library cards are anonymous credentials: a number that unlocks a door. COMMON ROOM asks what a card would look like if it recorded how someone actually uses the library, and whether that object could be memorable enough to keep.</p>
        <div className="mo-hero-cards" aria-hidden="true">
          {SPEC.map((s, i) => <div key={s.family} className="mo-hero-card" style={{ '--i': i }}><CardFront family={s.family} actions={s.actions} secrets={s.secrets} owner={owner(s)} detail={0.6} stamp /></div>)}
        </div>
      </section>

      <section className="mo-section mo-split">
        <div>
          <span className="mo-kicker">01 · THE PROBLEM</span>
          <h2>Access is not belonging.</h2>
        </div>
        <div className="mo-text">
          <p>Public libraries are among the last places in a city where you can stay without paying and leave with something. Yet the object that says “you are a member” is usually the least expressive thing in the building.</p>
          <p>The brief I set myself: make the membership card carry evidence of participation, without turning it into a personality quiz, a points system or a badge.</p>
          <blockquote>Don’t ask visitors how they belong. Let what they do inside the library leave the evidence.</blockquote>
        </div>
      </section>

      <section className="mo-section">
        <span className="mo-kicker">02 · THE SYSTEM</span>
        <h2>Four rooms, four families, one card.</h2>
        <div className="mo-rooms">
          {[
            ['THE STACKS', 'READER', 'Pull a book, leave a pencil mark in its margin.'],
            ['THE WORKSHOP', 'MAKER', 'Register two impressions on a letterpress, choose paper and ink.'],
            ['THE INDEX', 'SEEKER', 'Follow catalogue cards from drawer to drawer.'],
            ['THE QUARTER', 'LOCAL', 'Pin the places that make the library feel local.'],
          ].map(([room, fam, line]) => (
            <article key={room}><b>{room}</b><strong>{fam}</strong><p>{line}</p></article>
          ))}
        </div>
        <p className="mo-note">Three marks accession the card. Its family is simply where most of your marks were made (ties go to your most recent one). Four hidden traces, one per room, are found only by people who look closely.</p>
      </section>

      <section className="mo-section">
        <span className="mo-kicker">03 · ANATOMY OF A CARD</span>
        <h2>Everything on it is something you did.</h2>
        <div className="mo-anatomy">
          <div className="mo-anatomy-card"><CardFront family="seeker" actions={SPEC[2].actions} secrets={['curiosity', 'borrower', 'before']} owner={{ ...owner(SPEC[2]), renewed: '02 OCT 2026', renewals: 1, wear: 0.35 }} stamp /></div>
          <ol>{ANATOMY.map(([title, text]) => <li key={title}><b>{title}</b><span>{text}</span></li>)}</ol>
        </div>
      </section>

      <section className="mo-section">
        <span className="mo-kicker">04 · ARCHIVE REFERENCES</span>
        <h2>Borrowed from real objects.</h2>
        <ul className="mo-refs">{REFERENCES.map(([a, b]) => <li key={a}><b>{a}</b><span>{b}</span></li>)}</ul>
      </section>

      <section className="mo-section">
        <span className="mo-kicker">05 · BEFORE / AFTER</span>
        <h2>From a broken credential to an object.</h2>
        <div className="mo-ba">
          <Figure src="/making-of/before-lobby.jpg" caption="Before — the hero card: text clipped by the window, overlapping lines, every visitor named “Mara Ellis”." />
          <Figure src="/making-of/after-lobby.jpg" caption="After — your card in front, the four families fanned behind it." />
          <Figure src="/making-of/before-stacks.jpg" caption="Before — the Stacks: three flat panels and an empty shelf." />
          <Figure src="/making-of/after-stacks.jpg" caption="After — a real shelf, an open book, a pencil mark in the margin." />
        </div>
        <div className="mo-grid3">
          <Figure src="/making-of/after-workshop.jpg" caption="The Workshop: letterpress registration." />
          <Figure src="/making-of/after-index.jpg" caption="The Index: a working card catalogue." />
          <Figure src="/making-of/after-quarter.jpg" caption="The Quarter: an engraved civic plan." />
        </div>
      </section>

      <section className="mo-section">
        <span className="mo-kicker">06 · TAKING IT HOME</span>
        <h2>The card leaves the website.</h2>
        <div className="mo-grid3">
          <Figure src="/making-of/after-back.jpg" caption="The back: date-registered slip, renewals and a QR code." />
          <Figure src="/making-of/after-print.jpg" caption="Print at home: CR80 size, cut, fold, glue." />
          <Figure src="/making-of/after-wall.jpg" caption="The Living Collection: real visitors’ cards, added by choice." />
        </div>
        <p className="mo-note">A shared link carries the whole visit in its URL and unfurls with a preview of the card. Adding a card to the public wall is opt-in and can be undone at any time.</p>
      </section>

      <section className="mo-section mo-split">
        <div>
          <span className="mo-kicker">07 · HOW IT’S BUILT</span>
          <h2>One drawing, many outputs.</h2>
        </div>
        <div className="mo-text">
          <p>The card is a single React SVG component. The same drawing becomes the card in the rooms, a three.js object with real thickness and foil in the Member Record, a PNG, a print-ready PDF and, on the server, the link-preview image rendered by a Cloudflare function.</p>
          <ul className="mo-facts">
            <li><b>No account</b> The record lives in the browser; the wall stores only cards people choose to share.</li>
            <li><b>Lazy by design</b> 3D and PDF code load only when needed; without WebGL the SVG card stays.</li>
            <li><b>Stack</b> React, Vite, SVG, three.js, jsPDF, Cloudflare Pages Functions, D1, resvg.</li>
            <li><b>Lighthouse (mobile)</b> accessibility 100, best practices 100, SEO 100 on the lobby.</li>
          </ul>
        </div>
      </section>

      <section className="mo-end">
        <h2>You do not receive a card.<br /><em>You accumulate one.</em></h2>
        <div className="mo-end-actions">
          <button className="mo-cta" onClick={() => navigate('/')}>Enter the library <ArrowRight size={16} /></button>
          <button className="mo-cta mo-cta-ghost" onClick={() => navigate('/cards')}>See the four cards</button>
        </div>
      </section>
    </main>
  )
}
