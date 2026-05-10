# Point-and-Click Story Game — Level 1 Pilot

## Vision
A minimal point-and-click adventure game exploring Kael's entry into the Haunted Castle of Highbury. This is a pilot to test interactivity, atmosphere, and narrative branching on the personal website.

---

## Level 1: The Threshold

### Setting
**Location:** The Haunted Castle of Highbury  
**Time:** Evening, as dusk settles into night  
**Tone:** Melancholic, dreamlike, with creeping unease beneath curiosity  
**Atmosphere:** Lonely, dusty, beautiful in decay — like stepping into a memory

### Character: Kael
A rogue from Highbury with a scholar's heart. He grew up hearing stories of the castle and the history buried within it. He doesn't believe in ghosts or curses — he believes in treasure and truth. He came here seeking both.

**Motivation:**
- A contact tipped him off: forgotten treasures lie unclaimed inside
- But more importantly: the castle's history has haunted him since childhood
- He wants to understand what *really* happened here
- He entered via a collapsed section of wall on the castle's side — safer than the main gate

---

## Level 1 Structure

### Act 1: The Threshold (Entry Point)

**Opening Narration:**
Kael squeezes through the gap in the collapsed stone wall. Cool air meets his face. Moonlight filters through cracks in the stonework, casting long shadows. The air is still. Dust hangs like ghosts in the silver light.

It's been decades since anyone's been here. Maybe longer.

He steps into a vast entrance hall. His eyes adjust. Shapes emerge from the darkness: furniture draped in cloth, tapestries faded beyond recognition, suits of armour standing like sentries. Everything is untouched. Everything is waiting.

This is the story he grew up with. Now he's inside it.

---

### Room 1: The Entrance Hall

**Description:**
A grand space frozen in time. Moonlight streams through high windows. Dust motes dance in the silver beams. There are three things that catch Kael's eye:

**Clickable Objects:**

| Object | First Interaction | Second+ Interaction | Narration Purpose |
|--------|-------------------|-------------------|-------------------|
| **Suit of Armour** | *Kael approaches one of the standing figures. The metal is pristine, unblemished. There's a longsword at its side.* "This is real. This is from the stories." *He draws the blade. It's lighter than he expected, perfectly balanced. For a moment, he feels less like a thief and more like a hero.* | *He runs his thumb along the hilt. There are symbols etched there — a crest he doesn't recognize. Not Highbury's crest. Something older.* | Establishes Kael as someone drawn to history, not just gold. The sword becomes his companion. |
| **Tapestry** | *Dust erupts in a cloud as he touches it. Through the haze, he makes out the weave: a grand hall, feasting, banners flying. It must have been magnificent once.* "This was a place of life. Music, laughter..." *Now there's only silence.* | *He looks closer. There's a detail in the corner he missed: figures standing apart, separate from the feast. Watching. Waiting.* | Hints at complexity — not just decay, but something deliberate. |
| **Overturned Chair** | *Near the center of the hall, a single chair lies on its side. Everything else is arranged, preserved... but this one has been knocked over.* "Why this one? Why here?" *His stomach tightens slightly.* | *He rights it. The wood is solid, unmarred. Recent damage? Or has it lain here for decades?* | First sign that something disrupted the stillness. |

**Progression Rule:**
After interacting with 2 of these 3 objects, a new passage becomes available. A doorway, previously obscured by shadow, now seems obvious.

**Transition Text:**
*Kael moves deeper into the hall, towards the inner chambers. The air grows colder. His breath becomes visible in pale wisps.*

---

### Room 2: The Dining Hall

**Description:**
A long table dominates the space. Place settings remain, untouched. Plates with food — mummified, preserved by the dry castle air. Wine in glasses, turned to vinegar. Everything suggests the occupants simply... vanished mid-meal.

**Clickable Objects:**

| Object | First Interaction | Second+ Interaction | Narration Purpose |
|--------|-------------------|-------------------|-------------------|
| **Table Setting** | *Kael sits at the head of the table. A plate of bread, dried fruit, cheese. A knife and fork, positioned as if awaiting a hand that never returned.* "They were eating. And then..." *He doesn't finish the thought.* | *He picks up a goblet. The smell is acrid, sour. This wasn't ancient. This was... recent. Within a generation, at least.* | Timeline disruption — the castle isn't as old as the stories suggest. |
| **Wall (Sword Marks)** | *He notices it now. Deep gouges in the stonework. Not wear. Impact. Deliberate, violent impact.* *Kael's hand instinctively goes to his new sword.* "There was a fight. Here. In this room." *His breath catches. The temperature drops another few degrees.* | *He traces the marks. Some are clean, precise — sword strikes. Others are ragged, desperate. There are dark stains beneath them. Rust-brown. Old blood.* | **THE SIGN.** Something terrible happened. |
| **Floor (Blood Splatter)** | *It's unmistakable now that he sees it. A dark stain on the stone floor, spreading outward like a terrible flower. More of them lead toward the far doorway.* *Kael's scholarly curiosity wars with sudden, primal fear.* "This wasn't in the stories. This was never..." *His voice trails off.* | *He forces himself to follow the trail with his eyes. The stains lead deeper into the castle. Into darkness.* | Path forward is established. But now fear is real. |

**Progression Rule:**
After interacting with at least 2 of these objects (particularly the wall and floor), Kael's fear becomes palpable. The atmosphere shifts.

**Transition Text:**
*Kael turns to leave, to go back the way he came. Rational thought screams at him: get out, get out NOW.*

*But the wind outside has picked up. It howls through the collapsed wall. The drafts shift the air inside, and somewhere in the darkness ahead, a door swings shut with a thunderous BOOM.*

*The passage back to the entrance hall is no longer open. Blocked.*

*Kael is no longer choosing whether to stay. He's choosing whether he moves forward or tries to force his way back through.*

---

## Level 1: End Sequence

### The Choice (Branching Point)

**Kael stands at the threshold between two paths:**

**Option A: "Forward"**
*Take the sword. Follow the blood. Understand what happened.*
→ **Progression:** Leads to Level 2 (deeper exploration)

**Option B: "Back"**
*Force your way back through the blocked passage. Leave this place behind.*
→ **Progression:** Leads to "Escape Ending" (Level 1 conclusion, game over for this playthrough)

### Recommended Path:
For the story Kael's character arc, **Option A** is where the narrative wants him. But the choice exists.

---

## Visual & Technical Requirements

### Aesthetic
- **Colour Palette:** Cool earth tones (deep greys, faded blues, silver from moonlight)
- **Objects:** Simple geometric shapes or minimalist silhouettes
- **Text:** Large, readable. Dark grey on light background or light text on dark background
- **Mood:** Minimize distraction. Everything serves atmosphere.

### Interactions
- Click object → text appears
- Can click same object multiple times for evolved narrative
- Progression tracked by number of interactions
- No inventory system for this pilot
- No combat mechanics

### UI/UX
1. Scene opens with **Opening Narration** at top
2. **Objects** displayed as clickable areas (label + description on hover)
3. **Interaction Text** appears below, replacing previous text
4. After 2+ interactions per room, **continue button** fades in
5. Second room triggers **final transition** and choice buttons
6. Choice triggers **fade-out** → end-of-level screen

### Responsive
- Mobile-friendly clickable areas
- Text scales readably
- Touch-friendly on phone/tablet

---

## Acceptance Criteria (Level 1 Complete When...)

- [ ] Room 1 renders with opening narration and 3 clickable objects
- [ ] Each object has 2+ different text responses (first vs. repeat clicks)
- [ ] Progression from Room 1 → Room 2 works smoothly
- [ ] Room 2 objects reveal the "struggle" atmosphere correctly
- [ ] Final transition and choice buttons appear after sufficient interaction
- [ ] Clicking either choice leads to appropriate end-of-level text
- [ ] Responsive on desktop + mobile
- [ ] No console errors
- [ ] Atmospheric and readable — tone is melancholic/dreamlike, not gimmicky

---

## Notes for Development

- **State to track:** `currentRoom`, `clickedObjects[]`, `interactionCount`, `choiceMade`
- **Atmosphere is key:** Use whitespace, pacing, and text timing. Don't rush.
- **Kael's voice:** Scholarly curiosity mixed with creeping fear. Show both.
- **No music required for pilot** (but sound design could enhance later)
- **No animations required** (simple fade-ins are fine)

**