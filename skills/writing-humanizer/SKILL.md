---
name: writing-humanizer
description: Remove signs of AI-generated writing from text. Use when editing or reviewing prose so it reads as human-written — blog posts, emails, public issue or PR replies, READMEs, resumes, any brand-facing or outbound text. Catches significance inflation, promotional language, -ing pseudo-analysis, vague attribution, negative parallelism and "X, not Y" contrasts, kicker endings, colon reveals, rule of three, em dash overuse, AI vocabulary, and chatbot artifacts, and fixes them by deleting or adding verifiable specifics rather than rephrasing.
---

# Humanizer: remove AI writing patterns

You are editing text so it reads as written by a person. Most of the catalog comes from Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), maintained by WikiProject AI Cleanup; the rest are tells current models produce in agent-written prose. The underlying cause is the same for all of them: a model drifts toward the most statistically likely phrasing for the widest range of cases, so its prose is generic in recognizable ways.

## Method

### 1. Calibrate to the genre

- **Prose** (blog post, email, essay, article, issue or PR reply): the whole catalog applies.
- **Reference docs** (README, CLAUDE.md, skill files, changelogs, API docs): headings, bold terms, bulleted lists, and tables are conventions there, not tells. The formatting patterns (19–23) apply only where formatting replaces sentences that should exist: bold sprinkled through a paragraph, or an inline-header list whose items restate their headers. The language and construction patterns still apply in full.
- **The document's own conventions win.** Heading case, quote style (straight or curly), dash usage, and list style follow what the document or its style guide already does. A README with Title Case headings keeps them.
- **Scale the pass to the length.** A short reply gets one read for chatbot artifacts, kickers, and inflated words. A long piece gets the full catalog plus the final check.

### 2. Fix in this order

1. **Delete.** Most flagged sentences are disposable abstractions sitting next to a concrete sentence that does the real work. See "The rephrase trap."
2. **Add a receipt.** If the claim has to stay, back it with a verifiable specific. See "The receipt rule."
3. **Rephrase**, only when the sentence carries meaning nothing nearby carries, and change the construction, not just the words.

### 3. Keep the author's voice

Voice comes from the author's draft or a voice guide; match it. Never add an opinion, feeling, experience, anecdote, or first-person claim the author didn't express. Personality comes from the author, not the editor.

When text has no voice at all, two moves are allowed: vary the rhythm (mix short and long sentences, and let a long one run when the thought needs room), and pull forward the specific detail already present in the source. Neither adds content.

---

## The rephrase trap

The most common failure when fixing these patterns is rewording the sentence while keeping its construction. The construction is the tell, not the punctuation or the vocabulary. Three attempts on one real opening line:

1. Original: "The power of MCP servers isn't any single data source — it's what happens when you connect them."
2. Punctuation swap: "...isn't any single data source; it's what happens when you connect them." The em dash is gone; the "isn't X, it's Y" template survived.
3. Template removed, abstraction kept: "The point of MCP servers is what happens when you connect them." No pattern left, but a limp thesis sentence nobody would write on purpose.
4. What worked: deleting the sentence. The concrete sentence next to it ("More than 60 servers span federal and state government, scientific and legal literature...") was the real opener all along.

When a sentence matches a pattern, try deletion before rewriting. Promote the concrete sentence; don't massage the template.

## The receipt rule

When a flagged sentence has to stay, the repair is a receipt, not a milder adjective. A receipt is a verifiable specific: a number, a named source, a date, an artifact, a measurement. Swapping "blazingly fast" for "quite fast" trades one tell for a weaker one; the human version is the number.

**Before:**
> The rewrite dramatically improved stability and performance across the board.

**After:**
> The rewrite fixed 128 bugs that reproduced in the old version and cut the Linux binary from 88 MB to 70 MB.

- **No receipt on hand, no claim.** Delete it or go get the number. Writing around a missing receipt ("significantly faster in many scenarios") is how hedged slop gets made.
- **Surviving praise points outward.** Warmth aimed at someone else's work reads human and keeps; praise aimed at your own work gets replaced by the receipt that would justify it.
- **Never invent the receipt.** A number, study, name, or quote that isn't in the source or the author's notes gets fetched from a real source or flagged for the author, never supplied. The After examples below assume the specific already exists.

---

## Catalog

Ordered roughly by how much damage each pattern does. Watch-lists flag density, not single use: one "crucial" is a word, five per page is a tell.

### Content patterns

#### 1. Significance inflation

**Watch for:** stands/serves as, is a testament/reminder, a vital/significant/crucial/pivotal/key role/moment, underscores/highlights its importance, reflects broader, enduring/lasting legacy, setting the stage for, marks a shift, turning point, evolving landscape, indelible mark, deeply rooted

**Problem:** Ordinary facts get framed as representing or contributing to some broader trend.

**Before:**
> The Statistical Institute of Catalonia was officially established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This initiative was part of a broader movement across Spain to decentralize administrative functions and enhance regional governance.

**After:**
> The Statistical Institute of Catalonia was established in 1989 to collect and publish regional statistics independently from Spain's national statistics office.

#### 2. Notability name-dropping

**Watch for:** independent coverage, local/regional/national media outlets, featured in, a leading expert, active social media presence

**Problem:** A list of outlets or follower counts stands in for what was actually said.

**Before:**
> Her views have been cited in The New York Times, BBC, Financial Times, and The Hindu. She maintains an active social media presence with over 500,000 followers.

**After:**
> In a 2024 New York Times interview, she argued that AI regulation should focus on outcomes rather than methods.

#### 3. -ing pseudo-analysis

**Watch for:** highlighting, underscoring, emphasizing, ensuring, reflecting, symbolizing, contributing to, fostering, encompassing, showcasing

**Problem:** Present-participle phrases tacked onto a sentence to add interpretation nobody made.

**Before:**
> The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.

**After:**
> The temple uses blue, green, and gold. The architect said the colors reference local bluebonnets and the Gulf coast.

#### 4. Promotional language

**Watch for:** boasts, vibrant, rich (figurative), profound, showcasing, exemplifies, commitment to, nestled, in the heart of, groundbreaking, renowned, breathtaking, must-visit, stunning, seamless, powerful, cutting-edge

**Before:**
> Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya Kobo stands as a vibrant town with a rich cultural heritage and stunning natural beauty.

**After:**
> Alamata Raya Kobo is a town in the Gonder region of Ethiopia, known for its weekly market and 18th-century church.

#### 5. Vague attribution

**Watch for:** industry reports, observers have noted, experts argue, some critics say, many believe, several sources (when few are cited)

**Before:**
> Due to its unique characteristics, the Haolai River is of interest to researchers and conservationists. Experts believe it plays a crucial role in the regional ecosystem.

**After:**
> The Haolai River supports several endemic fish species, according to a 2019 survey by the Chinese Academy of Sciences.

#### 6. Formulaic challenges and outlook sections

**Watch for:** Despite its... faces several challenges, Despite these challenges, Challenges and Legacy, Future Outlook

**Before:**
> Despite its industrial prosperity, Korattur faces challenges typical of urban areas, including traffic congestion and water scarcity. Despite these challenges, with its strategic location and ongoing initiatives, Korattur continues to thrive as an integral part of Chennai's growth.

**After:**
> Traffic congestion increased after 2015 when three new IT parks opened. The municipal corporation began a stormwater drainage project in 2022 to address recurring floods.

#### 7. Generic positive conclusions

**Watch for:** the future looks bright, exciting times ahead, a step in the right direction, only time will tell, the journey continues

**Before:**
> The future looks bright for the company. Exciting times lie ahead as they continue their journey toward excellence.

**After:**
> The company plans to open two more locations next year.

### Construction patterns

#### 8. Negative parallelism and manufactured contrast

**Watch for:** not only... but, it's not just X, it's Y; isn't X — it's Y; the short appositive "X, not Y"

**Problem:** A contrast against a claim nobody made. Real contrast corrects something the reader plausibly believes; manufactured contrast sets up a strawman to knock down.

**Before:**
> It's not just about the beat riding under the vocals; it's part of the aggression and atmosphere. It's not merely a song, it's a statement.

**After:**
> The heavy beat adds to the aggressive tone.

**Before:**
> The fix is structural, not cosmetic.

**After:**
> The fix moves validation into the schema, so bad input fails before the handler runs.

#### 9. Kickers and repeated sentence skeletons

**Watch for:** paragraphs or sections that end on a short quotable line restating what came before: "That's the point." "And that changes everything." "Simple as that." "The data was always there." A pet phrase or sentence shape that recurs every few paragraphs.

**Problem:** Each instance reads fine alone; the recurrence is the tell. One earned kicker in a piece is human, one per paragraph is a model.

**Before (endings of two sections in one document):**
> The data exists in five separate places; the work has always been connecting it.
> The pieces already exist in public data; the burden has always been assembling them.

**After:** keep the strongest instance, if any, and flatten the rest to plain statements: "The data exists in five separate places."

#### 10. Colon reveals and staged questions

**Watch for:** "The result: X." "Here's the thing: X." "The catch? X." "So what changed? X." "Why does this matter? Because..."

**Problem:** A plain statement held back to manufacture suspense. State it.

**Before:**
> So what changed? The cache. The old version recomputed every request; the new one doesn't.

**After:**
> The new version caches results instead of recomputing them on every request.

#### 11. Rule of three

**Problem:** Ideas forced into groups of three to look comprehensive, often with the third item vaguer than the first two.

**Before:**
> The event features keynote sessions, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.

**After:**
> The event includes talks and panels, with time for informal networking between sessions.

#### 12. False ranges

**Problem:** "From X to Y" where X and Y aren't on a real continuum (time, scale, a lifecycle). "From the morning paper to the citation network built decades later" is a range; "from Siemens controllers to Cisco gear to Apple Xcode" is a list in a range's clothes. Flatten those to a plain list.

**Before:**
> Our journey through the universe has taken us from the singularity of the Big Bang to the grand cosmic web, from the birth and death of stars to the enigmatic dance of dark matter.

**After:**
> The book covers the Big Bang, star formation, and current theories about dark matter.

#### 13. Synonym cycling

**Problem:** The same referent renamed in every sentence to avoid repeating a word. Repetition is fine; a reader tracking four names for one thing is not.

**Before:**
> The protagonist faces many challenges. The main character must overcome obstacles. The central figure eventually triumphs. The hero returns home.

**After:**
> The protagonist faces many challenges but eventually triumphs and returns home.

#### 14. Copula avoidance

**Watch for:** serves as, stands as, functions as, represents, boasts, features, offers (where "is" or "has" would do)

**Before:**
> Gallery 825 serves as LAAA's exhibition space for contemporary art. The gallery features four separate spaces and boasts over 3,000 square feet.

**After:**
> Gallery 825 is LAAA's exhibition space for contemporary art. It has four rooms totaling 3,000 square feet.

### Word-level patterns

#### 15. AI vocabulary

**Earlier-model words:** additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight (verb), interplay, intricate, key (adjective), landscape (abstract), pivotal, showcase, tapestry, testament, underscore, valuable, vibrant

**Current-model words:** genuinely, honestly, truly, quietly, deeply, actually (as intensifiers); the real X; worth noting; at its core; the heart of; load-bearing; lands (as in "the point lands"); surface (verb); unlock; elevate; navigate (abstract); robust; comprehensive; nuanced

**Problem:** These cluster. Two or three in a paragraph is the signal; replacing each with its nearest synonym ("crucial" → "critical") leaves the signal intact. Delete the word or say the specific thing it gestures at.

**Before:**
> Additionally, a distinctive feature of Somali cuisine is the incorporation of camel meat. An enduring testament to Italian colonial influence is the widespread adoption of pasta in the local culinary landscape.

**After:**
> Somali cuisine also includes camel meat, which is considered a delicacy. Pasta dishes, introduced during Italian colonization, remain common, especially in the south.

#### 16. Filler phrases

- "In order to achieve this goal" → "To achieve this"
- "Due to the fact that it was raining" → "Because it was raining"
- "At this point in time" → "Now"
- "The system has the ability to process" → "The system can process"
- "It is important to note that the data shows" → "The data shows"

#### 17. Excessive hedging

**Before:**
> It could potentially possibly be argued that the policy might have some effect on outcomes.

**After:**
> The policy may affect outcomes.

#### 18. Knowledge-cutoff disclaimers

**Watch for:** as of my last update, while specific details are limited, based on available information, it appears that

**Before:**
> While specific details about the company's founding are not extensively documented in readily available sources, it appears to have been established sometime in the 1990s.

**After:**
> The company was founded in 1994, according to its registration documents.

### Formatting patterns (prose; see genre calibration)

#### 19. Em dash overuse

**Problem:** Dashes used for punch where other punctuation does the job.

**Before:**
> The term is primarily promoted by Dutch institutions—not by the people themselves. You don't say "Netherlands, Europe" as an address—yet this mislabeling continues—even in official documents.

**After:**
> The term is primarily promoted by Dutch institutions, not by the people themselves. You don't say "Netherlands, Europe" as an address, yet this mislabeling continues in official documents.

**Fix:** convert each dash to what it's doing: a colon (elaboration), a semicolon or period (two clauses), parentheses (an aside or inline list), a comma (a pause), or nothing (fake drama: "never in the same database — until you join them" loses nothing without it). Swapping every dash for a comma produces splices. Keep a few earned dashes; zero is its own tell.

#### 20. Boldface in running text

**Before:**
> It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.

**After:**
> It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.

#### 21. Inline-header lists that restate their headers

**Before:**
> - **User Experience:** The user experience has been significantly improved with a new interface.
> - **Performance:** Performance has been enhanced through optimized algorithms.
> - **Security:** Security has been strengthened with end-to-end encryption.

**After:**
> The update adds a new interface, faster load times, and end-to-end encryption.

In reference docs, a labeled list is fine when each label adds information the item doesn't repeat.

#### 22. Heading case

Follow the document's convention. Where prose has none, sentence case reads more natural than Title Case on every heading.

#### 23. Emojis as decoration

**Before:**
> 🚀 **Launch Phase:** The product launches in Q3
> 💡 **Key Insight:** Users prefer simplicity

**After:**
> The product launches in Q3. User research showed a preference for simplicity.

### Communication patterns

#### 24. Chatbot artifacts

**Watch for:** I hope this helps, Of course!, Certainly!, Great question!, You're absolutely right, Would you like me to..., Let me know if you'd like me to expand, Here is a...

**Before:**
> Here is an overview of the French Revolution. I hope this helps! Let me know if you'd like me to expand on any section.

**After:**
> The French Revolution began in 1789 when financial crisis and food shortages led to widespread unrest.

**Email register:** the same reflex shows up as boilerplate openers and closers: "I hope this email finds you well," "I wanted to reach out," "Please don't hesitate to reach out," "Looking forward to hearing from you." Open on the reason for writing and close with a plain, specific line. A real greeting and a genuine thanks are human and stay; a plain ask like "let me know if that works" is ordinary correspondence and stays. The tell is the boilerplate, and the chatbot offer to do more.

#### 25. Sycophancy

**Before:**
> Great question! You're absolutely right that this is a complex topic. That's an excellent point about the economic factors.

**After:**
> The economic factors you mentioned matter here.

---

## Over-correction

A pass can introduce its own tells. Check for these before finishing:

- **Staccato.** Every sentence short, fragments used as punchlines. Varied rhythm is the human pattern, and a long sentence that earns its length is fine.
- **Zero dashes, zero bold, zero lists.** Total absence reads as scrubbed. Keep what's earned.
- **Stripped warmth.** In correspondence the greeting and the thanks to someone who did real work survive every pass; only the boilerplate around them goes.
- **Broken conventions.** Lowercasing headings in a Title Case document, turning a reference table into paragraphs, or straightening quotes in a document that uses curly ones.
- **Synonym swaps.** Replacing a flagged word with its nearest neighbor and calling the pattern fixed.
- **Lost receipts.** Deleting a concrete fact along with the slop around it.
- **Neutralized voice.** Flattening an author's opinions or humor into encyclopedia tone.

## Final check

1. Read the last sentence of every paragraph and section in sequence. If more than one lands as a quotable line, flatten all but the strongest.
2. Scan for a sentence shape or phrase that recurs across sections.
3. Trace every number, name, date, and quote to the source or the author's notes. Anything that doesn't trace is removed or flagged.
4. Read the opening. It should start on the subject, not on a framing statement about the subject.
5. Compare against the original. Nothing the author meant is lost, and nothing they didn't say was added.

## Output

- **Given a file:** edit it in place, one located change at a time, then summarize the changes in a few lines grouped by pattern.
- **Given text:** return the rewritten text, followed by a short list of changes when the pass was substantial.
- **Either way:** list any claim that needs a receipt the source doesn't have, so the author can supply it or cut it.

---

## Worked example

**Before:**
> Great question! Here is an overview of AI coding assistants. I hope this helps!
>
> AI-assisted coding stands as a testament to the transformative potential of large language models, marking a pivotal moment in the evolving landscape of software development. These groundbreaking tools — nestled at the intersection of research and practice — are reshaping how engineers ideate, iterate, and deliver.
>
> At its core, the value proposition is clear: streamlining workflows, enhancing collaboration, and fostering innovation. It's not just about autocomplete; it's about unlocking creativity at scale. In GitHub's 2022 controlled experiment, developers using Copilot finished an HTTP server task 55% faster than a control group. Industry observers have noted that adoption has accelerated from hobbyist experiments to enterprise-wide rollouts.
>
> - 💡 **Speed:** Code generation is significantly faster, empowering developers.
> - 🚀 **Quality:** Output quality has been enhanced, contributing to higher standards.
> - ✅ **Adoption:** Usage continues to grow, reflecting broader industry trends.
>
> Despite challenges typical of emerging technologies — including hallucinations and accountability — the ecosystem continues to thrive. A 2024 Uplevel analysis of about 800 developers found no significant change in pull-request cycle time after their teams adopted Copilot, along with a 41% higher bug rate. The takeaway? The tools are only as good as the people using them.
>
> In conclusion, the future looks bright. Let me know if you'd like me to expand on any section!

**After:**
> In a 2022 controlled experiment run by GitHub, developers using Copilot finished an HTTP server task 55% faster than a control group. Results from working teams have been less clear. A 2024 Uplevel analysis of about 800 developers found no significant change in pull-request cycle time after their teams adopted Copilot, along with a 41% higher bug rate.

**Changes:**
- Deleted, not rephrased: chatbot artifacts, significance inflation, promotional language, the negative parallelism, the rule-of-three list, the false range, the vague attribution, the emoji list, the generic conclusion. None of those sentences carried a fact.
- Deleted the staged question and kicker ("The takeaway? The tools are only as good as the people using them."); the data already makes the point.
- Promoted the two facts the Before contained, joined by one sentence the data supports.

The After is short because the Before held two facts and everything else was packaging. When a pass leaves too little, that's a receipt problem: get more specifics from the author or a real source, never pad the gap.
