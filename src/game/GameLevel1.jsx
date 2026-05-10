import { useState } from 'react'

// ─── Game Content ────────────────────────────────────────────────────────────

const OPENING = [
  "Kael squeezes through the gap in the collapsed stone wall. Cool air meets his face. Moonlight filters through cracks in the stonework, casting long shadows. The air is still. Dust hangs like ghosts in the silver light.",
  "It's been decades since anyone's been here. Maybe longer.",
  "He steps into a vast entrance hall. His eyes adjust. Shapes emerge from the darkness: furniture draped in cloth, tapestries faded beyond recognition, suits of armour standing like sentries. Everything is untouched. Everything is waiting.",
  "This is the story he grew up with. Now he's inside it.",
]

const ROOMS = {
  entrance: {
    title: 'The Entrance Hall',
    description: 'A grand space frozen in time. Moonlight streams through high windows. Dust motes dance in the silver beams. There are three things that catch Kael\'s eye.',
    threshold: 2,
    transition: "Kael moves deeper into the hall, towards the inner chambers. The air grows colder. His breath becomes visible in pale wisps.",
    objects: {
      armour: {
        label: 'Suit of Armour',
        responses: [
          "Kael approaches one of the standing figures. The metal is pristine, unblemished. There's a longsword at its side.\n\n\"This is real. This is from the stories.\"\n\nHe draws the blade. It's lighter than he expected, perfectly balanced. For a moment, he feels less like a thief and more like a hero.",
          "He runs his thumb along the hilt. There are symbols etched there — a crest he doesn't recognize. Not Highbury's crest.\n\nSomething older.",
        ],
      },
      tapestry: {
        label: 'Tapestry',
        responses: [
          "Dust erupts in a cloud as he touches it. Through the haze, he makes out the weave: a grand hall, feasting, banners flying. It must have been magnificent once.\n\n\"This was a place of life. Music, laughter...\"\n\nNow there's only silence.",
          "He looks closer. There's a detail in the corner he missed: figures standing apart, separate from the feast.\n\nWatching. Waiting.",
        ],
      },
      chair: {
        label: 'Overturned Chair',
        responses: [
          "Near the center of the hall, a single chair lies on its side. Everything else is arranged, preserved... but this one has been knocked over.\n\n\"Why this one? Why here?\"\n\nHis stomach tightens slightly.",
          "He rights it. The wood is solid, unmarred.\n\nRecent damage? Or has it lain here for decades?",
        ],
      },
    },
  },
  dining: {
    title: 'The Dining Hall',
    description: 'A long table dominates the space. Place settings remain, untouched. Plates with food — mummified, preserved by the dry castle air. Wine in glasses, turned to vinegar. Everything suggests the occupants simply... vanished mid-meal.',
    threshold: 2,
    transition: "Kael turns to leave, to go back the way he came. Rational thought screams at him: get out, get out NOW.\n\nBut the wind outside has picked up. It howls through the collapsed wall. The drafts shift the air inside, and somewhere in the darkness ahead, a door swings shut with a thunderous BOOM.\n\nThe passage back to the entrance hall is no longer open. Blocked.\n\nKael is no longer choosing whether to stay. He's choosing whether he moves forward or tries to force his way back through.",
    objects: {
      table: {
        label: 'Table Setting',
        responses: [
          "Kael sits at the head of the table. A plate of bread, dried fruit, cheese. A knife and fork, positioned as if awaiting a hand that never returned.\n\n\"They were eating. And then...\"\n\nHe doesn't finish the thought.",
          "He picks up a goblet. The smell is acrid, sour.\n\nThis wasn't ancient. This was... recent. Within a generation, at least.",
        ],
      },
      wall: {
        label: 'Sword Marks on the Wall',
        responses: [
          "He notices it now. Deep gouges in the stonework. Not wear. Impact. Deliberate, violent impact.\n\nKael's hand instinctively goes to his new sword.\n\n\"There was a fight. Here. In this room.\"\n\nHis breath catches. The temperature drops another few degrees.",
          "He traces the marks. Some are clean, precise — sword strikes. Others are ragged, desperate.\n\nThere are dark stains beneath them. Rust-brown. Old blood.",
        ],
      },
      floor: {
        label: 'Dark Stains on the Floor',
        responses: [
          "It's unmistakable now that he sees it. A dark stain on the stone floor, spreading outward like a terrible flower. More of them lead toward the far doorway.\n\nKael's scholarly curiosity wars with sudden, primal fear.\n\n\"This wasn't in the stories. This was never...\"\n\nHis voice trails off.",
          "He forces himself to follow the trail with his eyes.\n\nThe stains lead deeper into the castle. Into darkness.",
        ],
      },
    },
  },
}

const ENDINGS = {
  A: {
    label: 'Move Forward',
    sublabel: 'Take the sword. Follow the blood. Understand what happened.',
    text: "He grips the sword. The weight of it is steadying.\n\nThe blood trail leads into the darkness ahead. There are answers here. Whatever happened to these people — whoever they were — they deserve to be known.\n\nKael steps forward.\n\nThe darkness swallows him.",
    coda: "Level 1 Complete",
  },
  B: {
    label: 'Force Back',
    sublabel: 'Leave this place behind.',
    text: "He turns to the blocked passage and throws his shoulder into the rubble. Stone grinds. Dust falls.\n\nHe pushes harder.\n\nThe stones give way. Cold night air floods in. He scrambles through, back into the moonlight, back into the open.\n\nBehind him, deep inside the castle, something shifts in the dark.\n\nHe doesn't look back.\n\nSome doors are better left unopened.",
    coda: "Escape Ending",
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NarrativeText({ text }) {
  return (
    <div className="mt-6 p-6 rounded bg-[#131620] border border-[#1e2535] text-[#b0bac8] text-base leading-8 whitespace-pre-line font-serif transition-all duration-500">
      {text}
    </div>
  )
}

function ObjectButton({ label, clickCount, onClick }) {
  const touched = clickCount > 0
  return (
    <button
      onClick={onClick}
      className={`
        text-left px-5 py-4 rounded border transition-all duration-200
        ${touched
          ? 'border-[#3a4a60] text-[#c2c8d4] bg-[#131a26]'
          : 'border-[#2a3040] text-[#8a9ab0] hover:border-[#4a5a70] hover:text-[#c2c8d4]'
        }
      `}
    >
      <span className="text-sm font-sans tracking-wide">{label}</span>
      {touched && (
        <span className="ml-2 text-xs text-[#4a5a70]">
          {'·'.repeat(Math.min(clickCount, 3))}
        </span>
      )}
    </button>
  )
}

function ContinueButton({ onClick, label = 'Continue →' }) {
  return (
    <button
      onClick={onClick}
      className="mt-8 px-6 py-3 border border-[#4a5a70] text-[#8a9ab0] text-sm rounded hover:border-[#8a9ab0] hover:text-[#c2c8d4] transition-all duration-300 font-sans tracking-wide"
    >
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GameLevel1() {
  const [phase, setPhase] = useState('prologue')
  // phase: prologue | entrance | entrance-transition | dining | dining-transition | choice | endA | endB

  const [clicks, setClicks] = useState({})
  // clicks[objectKey] = number of times clicked

  const [narrative, setNarrative] = useState(null)
  const [activeObject, setActiveObject] = useState(null)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getClickCount = (key) => clicks[key] ?? 0

  const handleObjectClick = (roomKey, objectKey) => {
    const room = ROOMS[roomKey]
    const obj = room.objects[objectKey]
    const count = getClickCount(objectKey)
    const responseIndex = Math.min(count, obj.responses.length - 1)

    setClicks(prev => ({ ...prev, [objectKey]: count + 1 }))
    setNarrative(obj.responses[responseIndex])
    setActiveObject(objectKey)
  }

  const uniqueInteracted = (roomKey) => {
    const keys = Object.keys(ROOMS[roomKey].objects)
    return keys.filter(k => (clicks[k] ?? 0) > 0).length
  }

  const canProgressRoom = (roomKey) =>
    uniqueInteracted(roomKey) >= ROOMS[roomKey].threshold

  // ── Phases ───────────────────────────────────────────────────────────────

  const goToEntranceTransition = () => {
    setNarrative(ROOMS.entrance.transition)
    setActiveObject(null)
    setPhase('entrance-transition')
  }

  const goToDining = () => {
    setNarrative(null)
    setActiveObject(null)
    setPhase('dining')
  }

  const goToDiningTransition = () => {
    setNarrative(ROOMS.dining.transition)
    setActiveObject(null)
    setPhase('dining-transition')
  }

  const goToChoice = () => {
    setNarrative(null)
    setPhase('choice')
  }

  const choose = (option) => {
    setPhase(`end${option}`)
  }

  const restart = () => {
    setPhase('prologue')
    setClicks({})
    setNarrative(null)
    setActiveObject(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0e1013] text-[#c2c8d4] font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* ── Prologue ── */}
        {phase === 'prologue' && (
          <div className="space-y-6">
            <p className="text-xs tracking-[0.2em] uppercase text-[#4a5a70]">Level 1 — The Threshold</p>
            <h1 className="text-2xl font-serif text-[#dde2ea]">The Haunted Castle of Highbury</h1>
            <div className="mt-8 space-y-5">
              {OPENING.map((para, i) => (
                <p key={i} className="text-[#a0abb8] leading-8 font-serif">{para}</p>
              ))}
            </div>
            <div className="pt-6">
              <ContinueButton onClick={() => setPhase('entrance')} label="Step inside →" />
            </div>
          </div>
        )}

        {/* ── Entrance Hall ── */}
        {(phase === 'entrance' || phase === 'entrance-transition') && (
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#4a5a70] mb-3">Room 1</p>
            <h2 className="text-xl font-serif text-[#dde2ea] mb-2">{ROOMS.entrance.title}</h2>
            <p className="text-sm text-[#6a7a8a] leading-7 mb-8">{ROOMS.entrance.description}</p>

            {phase === 'entrance' && (
              <div className="flex flex-col gap-3">
                {Object.entries(ROOMS.entrance.objects).map(([key, obj]) => (
                  <ObjectButton
                    key={key}
                    label={obj.label}
                    clickCount={getClickCount(key)}
                    onClick={() => handleObjectClick('entrance', key)}
                  />
                ))}
              </div>
            )}

            {narrative && <NarrativeText text={narrative} />}

            {phase === 'entrance' && canProgressRoom('entrance') && (
              <ContinueButton onClick={goToEntranceTransition} />
            )}

            {phase === 'entrance-transition' && (
              <ContinueButton onClick={goToDining} label="Move deeper →" />
            )}
          </div>
        )}

        {/* ── Dining Hall ── */}
        {(phase === 'dining' || phase === 'dining-transition') && (
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#4a5a70] mb-3">Room 2</p>
            <h2 className="text-xl font-serif text-[#dde2ea] mb-2">{ROOMS.dining.title}</h2>
            <p className="text-sm text-[#6a7a8a] leading-7 mb-8">{ROOMS.dining.description}</p>

            {phase === 'dining' && (
              <div className="flex flex-col gap-3">
                {Object.entries(ROOMS.dining.objects).map(([key, obj]) => (
                  <ObjectButton
                    key={key}
                    label={obj.label}
                    clickCount={getClickCount(key)}
                    onClick={() => handleObjectClick('dining', key)}
                  />
                ))}
              </div>
            )}

            {narrative && <NarrativeText text={narrative} />}

            {phase === 'dining' && canProgressRoom('dining') && (
              <ContinueButton onClick={goToDiningTransition} />
            )}

            {phase === 'dining-transition' && (
              <ContinueButton onClick={goToChoice} label="Face the choice →" />
            )}
          </div>
        )}

        {/* ── The Choice ── */}
        {phase === 'choice' && (
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[#4a5a70] mb-3">The Choice</p>
            <p className="text-[#a0abb8] font-serif leading-8 mb-10">
              Kael stands at the threshold between two paths.
            </p>
            <div className="flex flex-col gap-4">
              {Object.entries(ENDINGS).map(([key, ending]) => (
                <button
                  key={key}
                  onClick={() => choose(key)}
                  className="text-left px-6 py-5 rounded border border-[#2a3040] hover:border-[#5a6a80] hover:bg-[#131a26] transition-all duration-200 group"
                >
                  <p className="text-[#c2c8d4] font-sans text-sm tracking-wide group-hover:text-[#dde2ea]">
                    {ending.label}
                  </p>
                  <p className="text-[#5a6a7a] text-xs mt-1 font-serif italic">
                    {ending.sublabel}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── End Screens ── */}
        {(phase === 'endA' || phase === 'endB') && (() => {
          const ending = ENDINGS[phase === 'endA' ? 'A' : 'B']
          return (
            <div>
              <NarrativeText text={ending.text} />
              <div className="mt-10 pt-8 border-t border-[#1e2535] flex items-center justify-between">
                <p className="text-xs tracking-[0.2em] uppercase text-[#4a5a70]">
                  {ending.coda}
                </p>
                <button
                  onClick={restart}
                  className="text-xs text-[#4a5a70] hover:text-[#8a9ab0] transition-colors duration-200 tracking-wide"
                >
                  Play again →
                </button>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
