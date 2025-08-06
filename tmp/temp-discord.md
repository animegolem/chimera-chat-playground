view code diff in CodeBlock
inkie
OP
 — 6/3/25, 5:09 AM
Hello, I wonder if anyone has had success in displaying code diffs inside a code block.
I saw that prismjs has a notion of diff with inserted/deleted tokens but they not seem directly accessible in Lexical. The prism diff Grammar for example is not loaded

I am looking into this and would like to know if there has already been discussion/experiments/proof-of-concepts on integrating this in Lexical

cf for example the prism diff-highlight plugin - https://prismjs.com/plugins/diff-highlight/
inkie
OP
 — 6/3/25, 12:21 PM
I started looking at this and here is my current understanding :
Prism has standard token names called "inserted" and "deleted" that have been included in the Lexical codebase.
They are styled in packages/lexical-playground/src/themes/PlaygroundEditorTheme.ts for example.

now only a few language grammars define such tokens :
 
"git" uses both 'inserted' & 'deleted' for git diff output parsing -
"cmake" uses 'inserted' apparently for 'class-name'
"textile" for whatever reason ('inserted' & 'deleted')
"diff" uses them as aliases in a slightly more complex tokenization

so as expected, if I activate git.ts in packages/lexical-code/src/CodeHighlighterPrism.ts I get 'inserted' and 'deleted' nodes, which are styled with mapped styles so we can identify the diffed lines, but the git grammar also tokenizes "string" so other parts are colored and it can be hard to identify what is colored and why.

also the current Lexical algo uses only 1 grammar, so if the git Grammar is used, it cannot also do a tentative highlighting of the underlying language.

using the diff grammar, nothing happens by default because the token types that are seen by Lexical are 'inserted-sign' and 'deleted-sign' and they are not mapped to styles.

on the Prismjs side, there is a diff-highlight plugin that makes a first pass with the diff Grammar and then does a little token dance to be able to do a second pass with a language grammar which could make it possible to have both diff highlighting and language highlighting in the same block if we can :
 
load the diff grammar
load the diff-highlight plugin
make lexical handle the specifics of the diff tokenization
manage to map the diff specific tokens to styles that could be used for a targeted colorization of the diff elements
 
inkie
OP
 — 6/6/25, 2:38 PM
I created a discussion for this on https://github.com/facebook/lexical/discussions/7608
GitHub
Adding support for code diff in Code Blocks · facebook lexical · ...
Hello, I have been looking into adding diff support to code blocks. I will describe here-under what are my findings and the challenges that I see. I think there is a way to reasonably do it but wou...
Adding support for code diff in Code Blocks · facebook lexical · ...
etrepum — 6/6/25, 2:43 PM
I don't think a lot of time is being spent on maintaining that prismjs support, I'm sure if you do the work to improve it and it doesn't cause any regressions then it would be accepted… but it might be a better use of your time to work on a new code highlighter that doesn't depend on prismjs at all (e.g. shiki with the js regexp engine)
not sure if it has anything like that diff plugin though, it does support diff but I don't know if it can be combined with another syntax
inkie
OP
 — 6/10/25, 9:31 AM
@etrepum interesting I did not know shiki.
so you think shiki would be a better dependency than prismjs ?
I'll take a look at it. I don't know how much time I can devote to this but for sure I'd like to improve the coding support and code interactions from within Lexical.
On an architecture level, do you think we can reach VSCode, sublime or zed's snappiness on large files with github like features (in code comments, in code diff with full view or reduced view, synchronized split panes, ..) ?
For future readers, the prismjs / code diff in Code Blocks support was merged via https://github.com/facebook/lexical/pull/7613 and should be available soon in 0.33+
etrepum — 6/10/25, 9:42 AM
lexical's current architecture is likely to be a bottleneck eventually for that, unless you are handling code editing in a decorator that is backed by a component specifically optimized for that purpose
inkie
OP
 — 6/10/25, 9:48 AM
@etrepum regarding shiki's integration within Lexical do you see it with their wasm support ? / I don't know if it is within Lexical horizon to have features targeting only wasm enabled devices and if this can be disabled or not in shiki
etrepum — 6/10/25, 9:49 AM
I specifically mentioned shiki's js regexp engine, not its wasm implementation
https://shiki.style/guide/regex-engines#javascript-regexp-engine
inkie
OP
 — 6/10/25, 9:56 AM
ok thanks I did not yet understand what that mention to the regex engine meant. so they have 2 parsers, a wasm impl and a js impl.
i'll try to see how much work is needed to replace prismjs with this
inkie
OP
 — 6/10/25, 12:57 PM
@etrepum for info for highlighted diffs it seems shiki has the feature but works a bit differently. it looks like it needs a first pass on code-as-text to add 'shiki' comments like // [!code --] or // [!code ++] where necessary
cf https://shiki.style/packages/transformers#transformernotationdiff
multiline strings may not like the end-of-line comments in some languages but that is an interesting idea to add parsing meta-data on lines 
etrepum — 6/10/25, 1:08 PM
that's the transformer that ships with shiki, but it's possible to do it in other ways… e.g. https://usagi.io/articles/2024-04-24-adding-diff-highlighting-to-markdown-using-shiki/
inkie
OP
 — 6/11/25, 6:19 AM
@etrepum can we continue discussing this here or do you prefer it closer to the github repo, in an issue ?

I looked a little bit at shiki and have a few questions

1/ there are 3 consecutive levels in parsing : tokens, ast, html
I think that Lexical would use the tokens level

2/ shiki proposes to use available css profiles as-is to avoid re-inventing the wheel
currently Lexical has a theme in the repo that defines rules for prism tokens.
should we target using the shiki themes as-is for tokens. can this code-highlight them live together with the Lexical theme ?

3/ not all languages will be shipped with Lexical. Currently it is possible for users to add Prism languages by simply loading a js file that will inject itself into prism. Does it make sense if Lexical hosts the language files ? should the user be able to define where these runtime additional files are located (on a cdn, elsewhere,..)

4/ for performance it seems it is better to have a singleton with the highligher - https://shiki.matsu.io/guide/best-performance#cache-the-highlighter-instance - is there a place to put that in Lexical ?. I would also need to be .dispose() at Lexical cleanup.

5/ regarding markup, shiki tokens begin with a line[] level. do you think this should be mapped in the html markup ? I mean html could be a sort of numbered list (linenumber + line of code). But I have not idea of the complexity involved regarding ContentEditable and reconciliation compared to what we already have.

probably as a first step we could keep the linear sequence of span that is already coded for prism and could probably be adapted to fit shiki. what do you think ?
etrepum — 6/11/25, 9:03 AM
I’m not familiar with the implementation details of shiki but html is definitely not right so tokens or ast makes sense

That probably makes sense, the lexical theme is not something that works very well with plugins anyway

Having to pre-bundle languages is one of the reasons why prism has not been a good solution

The react lifecycle gives you a place to have a singleton with dispose (useEffect)

Lines as inline lexical elements for highlighting probably makes sense and would fix issues like line numbering.
inkie
OP
 — 6/11/25, 10:07 AM
@etrepum thanks for the feedback
2.[shiki themes] and 3.[towards not pre-bundled languages] : would the Lexical website host these lazy loading resources, commited in the repo or should I look for some free cdn for this ?

I will look into that maybe it is possible during the plugin instanciation

do you mean that Lines could become a sort of CodeLineNode inheriting from ElementNode and containing ? I agree it seems semantically better to have it and it could solve Line Numbering. I just hope this goes smoothly with the Tab/Indent work that was done.

how do you see the tokens ?
<CodeLineNode><TabNode/><CodeHighlightNode/><CodeHighlightNode/></CodeLineNode><br>
<CodeLineNode><CodeHighlightNode/></CodeLineNode><br>
<CodeLineNode><CodeHighlightNode/></CodeLineNode>
etrepum — 6/11/25, 10:09 AM
2/3 - I would rely on the bundler and the import function to do lazy loading, not a given CDN

5 - yes, something like that
inkie
OP
 — 6/12/25, 9:17 AM
@etrepum, i am still investigating shiki. I realize that there is a difference in approach between the Prismjs integration and shiki.

in Prismjs, Lexical get the tokens from Prismjs and each token is semantically linked to the code structure via its type (operator, comment, property, ...). In turn, Lexical CodeHighlightNodes have an highlightType property that is down the road used by the playgroundTheme to decide on the applicable css class.

in shiki, even at the token level, we don't have access to the stuctural type of the tokens (operator, comment, property, ...). The theme is applied on the first pass and inlined into the token as properties ("color" for example).
for "alert(1);" you get something like in the uploaded screenshot.

That's probably the only way to have the style applied as themes are not .css files but .ts files that are called early in the tokenization process.

do you see a problem with embedding these styling attributes onto the CodeHighlightNodes. They would need to be forwarded as is to the reconciled html.

another question, does lexical have a notion of light/dark mode ? shiki has a way where you can render 2 themes or more and then filter the one you want to display via media query. cf https://shiki.style/guide/dual-themes 
Image
Shiki
A beautiful yet powerful syntax highlighter
Shiki
etrepum — 6/12/25, 9:26 AM
Lexical doesn’t have a light/dark mode. Usually people handle that with CSS, and it’s not part of the document, so it’s not really in the scope of what matters to the editor.
Inline styles are fine
inkie
OP
 — 6/12/25, 9:28 AM
ok thanks
inkie
OP
 — 6/12/25, 9:50 AM
@etrepum I found https://github.com/facebook/lexical/tree/main/examples/node-state-style/src with its styleState ; should I use NodeState to add styling to the editor ? it seems like this could simplify things but styleState doesn't seem to be included in the main code (/examples directory) and I am not sure yet how to "promote" it and use it only for the CodeEditor nodes
etrepum — 6/12/25, 10:01 AM
Most nodes already have a style property (as a string) that could be used for this, the style state example is just an example that exercises a more complex use case for node state.
inkie
OP
 — 6/12/25, 10:03 AM
ok I'll look into examples of nodes having a style property then 
etrepum — 6/12/25, 10:10 AM
It’s not used much except for TextNode but it’s there, some nodes don’t support it in createDOM/updateDOM/exportDOM but that’s a straightforward addition
inkie
OP
 — 6/12/25, 12:30 PM
@etrepum in order to get familiar with this and the fact that TextNode has the style attribute, I tried to call this.setStyle('background-color: red;'); in CodeHighlightNode's constructor since it inherits from TextNode This works for the first typed char and then I get "InternalError: too much recursion"

it works though when I do the setStyle in $createCodeHighlightNode().

can you explain to me why it does not work via the constructor ?
etrepum — 6/12/25, 12:33 PM
I don’t know where you’re doing that but presumably it’s because of the code highlighter plug-in seeing that as an update and then reformatting again
Would have to look at the stack trace to see exactly what’s happening
inkie
OP
 — 6/12/25, 12:34 PM
simply editing packages/lexical-code/src/CodeHighlightNode.ts in order to try things
Uncaught InternalError: too much recursion
    LexicalNode LexicalNode.ts:320
    TextNode LexicalTextNode.ts:323
    CodeHighlightNode CodeHighlightNode.ts:109
    clone CodeHighlightNode.ts:119
    $cloneWithProperties LexicalUtils.ts:1911
    getWritable LexicalNode.ts:794
    setStyle LexicalTextNode.ts:745
    CodeHighlightNode CodeHighlightNode.ts:111
ok maybe it's because it is considered as an edit so getWritable is called while in $create.. getWritable is already called (?)
etrepum — 6/12/25, 12:38 PM
I can’t debug over Discord like that, would have to see all of the context
The clone is suspicious, that’s not something that typically happens in a constructor
inkie
OP
 — 6/12/25, 12:40 PM
no problem thanks I still need to grasp some Lexical concepts
etrepum — 6/12/25, 12:40 PM
Are you calling setStyle before super or something?
inkie
OP
 — 6/12/25, 12:41 PM
constructor(
    text: string = '',
    highlightType?: string | null | undefined,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__highlightType = highlightType;
    this.setStyle("background-color: red;");
  }
only diff is this.setStyle("background-color: red;"); added
etrepum — 6/12/25, 12:44 PM
Setting __style directly would avoid running any other code, it is always already writable in the constructor. Would be able to say more without seeing all the relevant code at once, but I’m not at a computer
inkie
OP
 — 6/12/25, 12:48 PM
yes I understand. thanks. I am just trying things to find my way and see how the current lexical-code can evolve to integrate shiki
etrepum — 6/12/25, 1:01 PM
I don't see any reason why that should behave differently in the constructor vs. the $create function. Probably whatever environment you're using is doing hot module replacement which can cause problems especially when using classes
a full restart of your dev server might've made the problem go away, or at least behave the same way with either placement
$applyNodeReplacement is a no-op unless a replacement is defined for that node class
and as long as the super is called first, $setNodeKey will make sure that the instance is in the _cloneNotNeeded set so that clone code shouldn't have run at all
inkie
OP
 — 6/12/25, 1:11 PM
hum I am simply running "npm run dev" with this only diff ; strange
etrepum — 6/12/25, 2:22 PM
ah ok so what's happening is that this is happening because clone is calling the constructor, which runs under some different conditions
it is more correct to do this in the $create function rather than the constructor (or use direct property assignment) because during a clone getWritable is unsafe
inkie
OP
 — 6/12/25, 2:37 PM
thanks for looking into this. I understand better now. Maybe I won't need to change the constructor of CodeHighlightNode or the $createCodeHighlightNode arguments to add the style ; just calling setStyle right after calling $createCodeHighlightNode will probably be sufficient I think
etrepum — 6/12/25, 2:41 PM
using __style in the constructor would also be fine, but it's better to have constructors be as trivial as possible (e.g. have as few constructor arguments as possible, all with defaults). It's more or less required for the yjs integration to be able to call any constructor with 0 arguments
inkie
OP
 — 6/13/25, 4:19 AM
@etrepum I am not totally familiar with ui components. I try to list all shiki supported languages in the playground dropdown but the list is very long and the DropDown does not seem to scroll (it just show the list cropped at the bottom of the screen). This was not a problem with the short list that was previously bundled but is a problem now. Do you know of another component I should use or should I just handpick a few languages in this Dropdown like was done before ?
in a playground perspective I see an interest of showing all available options ; but in a UX perspective I doubt 304 options is user friendly
even shiki's "web language" list has 70 elements which is too long to fit
inkie
OP
 — 6/13/25, 4:33 AM
I think for now I will get the full list as an export but filter it to keep the old list in the playground ToolbarPlugin
etrepum — 6/13/25, 9:37 AM
AFAIK the playground doesn’t yet have a UI component suitable for that purpose
inkie
OP
 — 6/14/25, 7:15 AM
@etrepum I nearly have an implementation with dynamic loading of languages and themes. As a first step, I kept the linear structure of Lexical Nodes. I need an advice on the markdown toggle.

When the CodeNode contains 'markdown' and the toggle is pressed, it is supposed to transform the markdown. This is done via
$convertFromMarkdownString(
  firstChild.getTextContent(),
  PLAYGROUND_TRANSFORMERS,
  undefined, // node
  shouldPreserveNewLinesInMarkdown,
);

inside an update() block.
The $convertFromMarkdownString will discover the one or several code blocks inside the markdown textContent and for each of the detected languages it needs to make sure the language is loaded asynchronously by awaiting a shiki API.

For now I have a 
async loadCodeLanguage API in /codeHighlighter.ts that I await in the playground outside of update blocks. It loads the language in the shiki singleton.

I cannot load it from inside $convertFromMarkdownString as it is synchronous.

The other way would be to have codeNode.setLanguage only set the language if the language is already loaded or use the default language otherwise. if the language is not already loaded, it would call an async function with (language, codeNodeKey) as argument which in turn would await on the shiki loadLanguage API and then update() to call {codeNodeKey}.setLanguage()

This would probably need some protection to avoid an infinite setLanguage loop if there is an error somewhere and the language is never loaded - seems doable.

now the real issue I have with this (not tested) is that it lead to some sort of flickering on the first time a language is loaded as lexical reconciliation would first go through with the default language

on the + side, the API would be simpler because a setLanguage would be sufficient to make sure a language is loaded, without the need for a new API to load a language.

do you know if there already are such async patterns in the code base ? 
etrepum — 6/14/25, 8:00 AM
I don’t think there are a lot of examples of async in the codebase, but that sounds like the right approach. Having a way to preload languages with the plug-in would make sense, then flickering could be avoided
inkie
OP
 — 6/14/25, 8:41 AM
is there a way to go from codeNodeKey -> CodeNode -> Editor as it seems I need the Editor to call update and in the worst case these async language loading could be in-flight across several Editors so I cannot just take any editor I could find

or can I simply call codeNode.setLanguage anywhere outside of an update() block ? 
etrepum — 6/14/25, 9:14 AM
You can get an editor reference from inside the update, so if you’re deferring something you’ll need to pass that along to use in the callback
inkie
OP
 — 6/14/25, 9:30 AM
you mean I could modify CodeNode.setLanguage()'s prototype to add an optional reference to the editor that It would pass along to the loadCodeLanguage async method. That would probably work.
I feared about messing up with setLanguage()'s prototype like that because of the warnings about these setters/getters in the doc but I'll try that.

if it is not authorized have this sort of complex args on the setters then I will resort to adding a method on Markdown to extract the unique list of languages from a markdown textContent
etrepum — 6/14/25, 9:32 AM
No I mean setLanguge is only called from updates and you have $getEditor()
The plug-in should track the code nodes with a transform and a mutation listener and it can decide when/if a language needs to be loaded and what to do after that happens
inkie
OP
 — 6/14/25, 10:33 AM
hum ok I haven't yet looked into that. I will now. So no change in the setLanguage prototype, but more of a transform/mutation listener.
but can I call await in a transform/mutation listener / can they by async function ?
inkie
OP
 — 6/14/25, 1:57 PM
Maybe I misunderstand something, but my problem is that :
 
setLanguage is called inside an update. the new language is set but not already loaded. I can $getEditor
a transform / a mutation listener of the plug-in will be informed of the modification and can trigger a loadLanguage. I don't think we can await the loadLanguage inside the listener so it would need to be a fire-and-forget call to async loadLanguage
loadLanguage will then await for shiki import outside of any synchronous update context. At this stage I know that the language is loaded so I would need to update() something to make the code rendered with the requested language. But here I should not call the $getEditor because the import may be very slow and the activeEditor may have changed either to null or another editor that has become active. This is why I have the impression that i need to pass a reference to the editor and the original codeNodeKey somewhere

am I wrong in saying that the async'ness of the shiki dynamic import forces me into a context where I cannot get access to the editor and the CodeNode on which setLanguage was originally called, even if I detect language changed via a listener ?
For now, the only way I see out of this is adding (editor, codeNodekey) as optional arguments to my async loadLanguage function.

sorry if this seems trivial to you I have difficulties findind the "correct" approach here. I will try to see if adding (editor, codeNodekey) on loadLanguage works.
etrepum — 6/14/25, 2:26 PM
So yes you will have to fire and forget something from an update when async work has to happen, but you can grab the reference to the editor before the async part and then once it’s resolved you would do an update or trigger a command on that editor
inkie
OP
 — 6/14/25, 2:53 PM
ok so I understand that we agree that: from the update, I need to fire and forget a call with the editor=$getEditor() as argument and then inside the called fire and forget function, use this editor reference to inform it that that the language has finished loading.
etrepum — 6/14/25, 3:09 PM
Yes
inkie
OP
 — 6/14/25, 3:21 PM
thanks it solves my last issue I think for the first version that keeps the same flat lexicalNode structure as before.

Now I need to polish things with
plaintext that is a special case in shiki
remove Prismjs leftovers
handle shiki language aliases
improve lazy loading of themes with the same API/mechanism as setLanguage
add possibility to preload chosen shiki languages and themes as plugin args
see how we could add custom languages and themes as plugin args
review and pass all tests (I expect many tokenization differences)
etrepum — 6/14/25, 3:26 PM
I would have it as a separate plug-in, that way it could be adopted gradually
inkie
OP
 — 6/14/25, 3:46 PM
hum ok why not that's a question I had. it is good you tell me because currently I am totally removing Prismjs

so you mean that lexical-code should handle both Prismjs & Shiki, with the current plugin using Prismjs and a new plugin using Shiki ?

I can look into it and try to see how to have this backward compatibility. It is a lot of work I think + will need 2 x the tests as Prism & shiki do not have the same tokenization but could be doable. maybe it won't be pretty if we need to keep all the exported methods of the Prism version.

The thing is that currently it does touch plugins/CodeHighlightPlugin at all. It will only change once I begin adding preloadable languages&themes

so do you really think we need Prismjs compatibility ?
+ if we go towards the "many highlight engines" scenario, I can try to v2 the abstraction that started around "Tokenizer" but the new scenario with dynamic imports add new complexities compared to what was done in v1 of the abstraction
etrepum — 6/14/25, 4:00 PM
It will be hard to get something merged that doesn’t have backwards compatibility, and with the very different tokenization and such it would make sense to have separate tests. I think prismjs should be deprecated if we have something that works better, but it would probably stay supported for at least half of a year. There’s not a lot of specificity for prism in the nodes themselves (other than the static language mapping stuff which will need to change a bit), it’s mostly in the stuff the plug-in adds
The highlighting could be moved to separate packages, e.g. lexical/code-prism and lexical/code-shiki. although for backwards compatibility the prism support would be a direct dependency for a while
inkie
OP
 — 6/14/25, 4:10 PM
ok I understand for backward compat. will see how this goes.

"although for backwards compatibility the prism support would be a direct dependency for a while" => you mean "lexical-code" would remain as is with the prism impl for a while ?

there are also dependencies in plugins/ToolbarPlugin as you said mainly for listing available languages & at least lexical-markdown for instanciating the CodeNodes. I am not sure I see right now how to choose between the different engines.

+ there is a need to bundle only what is needed so someone configuring only the old plugin should not bundle shiki I suppose

will need some thought on my part
etrepum — 6/14/25, 4:13 PM
the toolbar plugin is part of the playground and is not a public api that requires longer term support
lexical-code doesn't necessarily have to stay as-is but it has to maintain the same exports. If the highlighter was moved to another package, lexical-code would then depend on that package and re-export the same API for a period of time.
etrepum — 6/14/25, 4:27 PM
I think the only in-node prism stuff is the setting of __isSyntaxHighlightSupported which could happen in a node transform defined by the highlighting plugin rather than in the node's construbtor and language setter
inkie
OP
 — 6/15/25, 3:07 AM
I see, but once you have the legacy plugin CodeHighlightPlugin and the new CodeHighlightPluginV2, it will be possible for someone to create 2 components : 
Editor1 using CodeHighlightPlugin
Editor2 using CodeHighlightPluginV2
and put them on the same page. Won't there be a conflict on CodeNode, CodeHighlightNode names ? 

Also, lexical-markdown needs to choose one implementation of the highlighter based on some import / runtime configuration. currently it uses code.$createCodeNode(..).

does it need to in fact $createCodeShikiNode of a CodeShikiNode that inherits from CodeNode. What will markdown in that case to $createCodeShikiNode vs $createCodePrismjsNode.

maybe I am missing something on my javascript foo but right now I don't see the whole.

if I see a way, would this lexical-code with an engine plugin system make sense to you ? engines could maybe be imported lazily and defaults could make it work with backward compat on the lexical-code exported API. I have to dig more
etrepum — 6/15/25, 3:18 AM
Plugins are scoped to the editor. The node types wouldn’t be different, just the implementation of the node transform that does the highlighting
inkie
OP
 — 6/15/25, 4:41 AM
ok step by step it gets clearer.

I think that what I try to understand is if you want to be able to show a Code Block rendered by prismjs and a Code Block rendered by shiki at the same time in the same editor.

if both plugins are registered, they will both register and implement node transforms on the same Nodes. Should I just discard that case saying it is not authorized to have 2 different CodeHighlightPlugin activated or add an engine property on the CodeNode so that the transforms know when they have to be a noop ?

Also if CodeHighlightPlugin gets deprecated ; I guess we could have 2 plugins : CodeHighlightShikiPlugin and CodeHighlightPrismjsPlugin

if we do not go with the engine property on CodeNode that would allow for several enginePlugins loaded at the same time, do you know of another plugin family that enforce the "only one plugin of this family can be instanciated on the editor" constraint so I can look how it is done ?
etrepum — 6/15/25, 10:12 AM
You wouldn’t want to have both in the same editor. There is no plug-in registration so you can’t prevent conflicting plugins, but I’m sure if you registered two code highlighters it would just cause infinite transforms for any code block.
There’s nothing stopping you from instantiating any other conflicting set of plugins (e.g. rich text and plain text).
inkie
OP
 — 6/15/25, 11:18 AM
I did not try it but I don't know about the infinite transforms if each transform is like ( switch(codeNode.engine)..case 'prismjs'; break; case 'shiki'; break; it seems to me that each codeBlock would converge to its engine version.)

So I understand that a highlightPlugin would register its transform and this way will define its CodeNode, CodeHighlightNode etc.

something I haven't yet my mind around is the lexical-markdown that imports import {$createCodeNode, $isCodeNode, CodeNode} from '@lexical/code';. This one is the legacy one that creates CodeNode for prisms.

does that mean that I need to have a shared CodeNode and CodeLexicalNode implementation for both plugins.

that would probably mean that these shared implementations of CodeNode & CodeLexicalNode can stay in lexical-code and we can simply have CodeHighligherPrism.ts & CodeHighlighterShiki.ts implementing some CodeHighlighter interface with the registrations, language handling & theme handling instead of creating lexical/code-prismjs or lexical-shiki

btw I have the feeling that it would maybe be possible to also add lazy loading for prism languages. Is that interesting ? 
inkie
OP
 — 6/15/25, 11:50 AM
or I could duplicate the CodeNode impl and indeed have lexical/code-prism and lexical/code-shiki autonomous since I had missed something and I understand now that the chosen CodeNode/CodeHighlightNodes are chosen when instantiating the App (cf lexical-playground/src/nodes/PlaygroundNodes.ts)
maybe I'll go with that it will be easier to not worry about abstracting things to share code.

the only problem I see with that is : how will lexical-markdown choose which $createCodeNode to use ?
etrepum — 6/15/25, 11:55 AM
the code blocks themselves don't have an engine at all, there's just code nodes that the plugins transform accordingly. you don't need to duplicate any node code between any of them, it's only the plugins and what they register that are different
inkie
OP
 — 6/15/25, 11:55 AM
same problem with ActionsPlugin, ComponentPickerPlugin, ToolbarPlugin that are all bound on import {$createCodeNode} from '@lexical/code'; .
etrepum — 6/15/25, 11:55 AM
you're missing the point here, there's only one implementation of those nodes
the highlighting code is not inside the nodes at all
none of those APIs to create and work with code nodes would change at all, the only thing changing here is the addition of a different highlighting plugin. the rendered output is also obviously different, because the plugin will transform those node trees in different ways
inkie
OP
 — 6/15/25, 12:06 PM
ok so the CodeNodes could stay in lexical-code and the implementations of the highlighting could be in either in lexical-code or lexical/code-shiki and lexical/code-prism.

but inside the CodeNodes, right now, in setLanguage I fire and forget the call to loadLanguage that is engine specific.

so what you're saying if I understand well it that I should not do that but rather call the fire-and-forget loadLanguage inside a transform (which I think you already told me but that I misunderstood at that time) 
etrepum — 6/15/25, 12:08 PM
you would make loadLanguage dispatch a command to the editor instead of creating a direct dependency and have the plugin register command listeners to do whatever needs to happen for that highlighting implementation
just like a lot of events in the editor just dispatch commands and then the rich text or plain text plugin (or something else at a higher priority) handles it appropriately
inkie
OP
 — 6/15/25, 12:14 PM
ok that's even better. I had indeed missed the point that the Nodes are mainly placeholders for properties.

do you think I can leave the IsSyntaxHighlightSupported as deprecated ?
I don 't see how I can check is the language is known/loaded without creating a dependency
etrepum — 6/15/25, 12:15 PM
you can have it there but set it from the plugin
inkie
OP
 — 6/15/25, 12:18 PM
currently there is 
const isLanguageSupportedByPrism = (
  language: string | null | undefined,
): boolean => {
  try {
    // eslint-disable-next-line no-prototype-builtins
    return language ? Prism.languages.hasOwnProperty(language) : false;
  } catch {
    return false;
  }
};
 inside CodeNode.ts

and writable.__isSyntaxHighlightSupported =
    isLanguageSupportedByPrism(language); in setLanguage.

so should I move both set of code into the plugin ? 
etrepum — 6/15/25, 12:20 PM
the property of the node would still be there but it would just be initialized to false in the constructor
and not updated by setLanguage
the plugin would be responsible for initializing it
updateDOM would have to change slightly to handle the case where the property changes independently from language (which would make it simpler really)
and afterCloneFrom should be implemented to just carry over the previous value

  afterCloneFrom(prevNode: this): void {
    this.__language = prevNode.__language;
    this.__isSyntaxHighlightSupported = prevNode.__isSyntaxHighlightSupported;
  }
inkie
OP
 — 6/15/25, 12:24 PM
yes setLanguage will dispatch a command 
the plugin will catch it in a registered callback
for shiki, the callback will fire-and-forget loading missing languages

can I ask what is this property for ?
data-language is the "language" requested by the user
and data-highlight-language is filled with the same language only if the language is available & loaded
etrepum — 6/15/25, 12:25 PM
it's for css
inkie
OP
 — 6/15/25, 12:29 PM
ok. well thanks for you help. I have a more correct understanding of Lexical's API know. I should now be able to go forward on the implementation with backward compatibility.
about afterCloneFrom(prevNode: this): void {
    this.__language = prevNode.__language;
    this.__isSyntaxHighlightSupported = prevNode.__isSyntaxHighlightSupported;
  }

you mean I have to add that in addition to static clone(node: CodeNode): CodeNode {
    const newNode = new CodeNode(node.__key);
    newNode.__language = node.__language;
    newNode.__theme = node.__theme;
    newNode.__isSyntaxHighlightSupported = node.__isSyntaxHighlightSupported;
    return newNode;
  } that is already in the code ?
etrepum — 6/15/25, 1:25 PM
it's preferable to remove logic from static clone and put it in afterCloneFrom because the latter is composable. logic in clone has to be repeated for every subclass
you can't call super on a static method
(at least not in a way that does anything useful)
inkie
OP
 — 6/16/25, 10:18 AM
@etrepum looking at the backward compat thing, I realize I may as well integrate into my reflexion the change of lexical node structure for code that was envisioned.
currently, prism has (LinebreakNode | TabNode | CodeHighlightNode)[]
shiki could have something like CodeLineNode[] with CodeLineNode containing (TabNode|CodeHighlightNode) - probably the LineBreakNodes wouldn't be necessary in this case I still don't know.

now there are many structural functions that are currently exported like $getEndOfCodeInLine for which the implementation needs different strategies depending on the choice of Lexical Node structure.

for backward compat I have 2 options :
 
keep the same functions, auto-detect in which structure we're in (for example by testing isCodeLineNode(parent))
or export different sets of functions like $getEndOfCodeInLineForFlatStructure and $getEndOfCodeInLineForLineStructure that puts the burden on the user to know what he needs or $getEndOfCodeInLinePrism and $getEndOfCodeInLineShiki to make it a bit more easy for the user to choose the correct function.

I am leaning towards option 1 : auto-detection, but would like to have your opinion on this 
etrepum — 6/16/25, 10:28 AM
I think that function, like the highlighter plug-in's code, can be colocated with the highlighter implementation (with prism's version being re-exported as deprecated in @lexical/code for backwards compatibility reasons). It's not really much of a user facing function, only really useful in the context of implementing a highlighter.
inkie
OP
 — 6/16/25, 10:38 AM
ok so except for the backward compat thing, basically make them private to the highlighter implementation. 
probably also I'll move $getFirstCodeNodeOfLine, $getLastCodeNodeOfLine and $getLastMatchingCodeNode out of CodeHighlightNode and into the highlighter implementation
inkie
OP
 — 6/23/25, 11:31 AM
@etrepum i am looking again at shiki integration with backward compat  ; 
I have a problem to manage CodeNode.insertNewAfter implementation wrt dependencies and would appreciate an advice

If I want Prism to keep its Flat structure and Shiki to have a CodeLine[] structure then CodeNode.insertNewAfter will need to have a different behavior depending whether we are on a Prism or Shiki structure. I don't really see on what to base this choice of algorithm.

so I wonder if v1 should be a Flat Structure for both Prism and Shiki ; and then v2 would move both Prism and Shiki to a CodeLine[] structure. Having a CodeNode that knows how to handle 2 different layout structure adds a lot of complexity imho, especially if we don't want to store the engine name on the code node.
etrepum — 6/23/25, 11:35 AM
I think the only thing that really needs to happen there is to figure out how much indentation to add after the newline, which is probably possible to implement in a way that can detect either structure by seeing what type the parent is
inkie
OP
 — 6/23/25, 11:46 AM
ok I'll dig more into this option.
so you are more in favor of keeping the Flat structure for Prism in the middle term for backward compat ?
etrepum — 6/23/25, 11:51 AM
yes I think backward compatibility is the reason to keep prism at all and changing the structure would defeat the purpose
rather than migrate prism to use some other structure it would make sense to deprecate and drop it, but ideally there is a path to migrate from one plugin to the other (e.g. the shiki plugin should be able to handle documents that were saved using the prism plugin)
inkie
OP
 — 6/23/25, 11:55 AM
I guess the question of backward compat also relates to ".lexical" files that may have need stored by users. at least a .lexical saved after a choice of plugin should be able to be reloaded by the same set of plugins
as you said, there could probably be an upgrade mechanism of some sort.
etrepum — 6/23/25, 12:01 PM
that's the same thing, .lexical is just the json format saved to a file
inkie
OP
 — 7/1/25, 8:36 AM
@etrepum I have a first version that refactors things to allow for both shiki with the same flat lexical node structure as prism & prism backward compat. I am going to start looking at the evolution of the structure for shiki (line-based structure).
I haven't yet started duplicating tests for shiki as the change of structure will imply modifications there.

should I send a PR with this interim version so that you can get a preview of what it looks like at this stage ? I can either leave prism activated in the playground or activate shiki as you prefer 
etrepum — 7/1/25, 8:37 AM
That’s up to you if you’re looking for feedback sooner than later
inkie
OP
 — 7/1/25, 8:46 AM
well yes I would appreciate feedback on
 
code organization & naming for handling both engines
evolutions on CodeNode & CodeHighlightNode to support async loading and remove dependency on Prism
feedback on shiki integration itself (adds a theme attr to CodeNode / which default theme should we choose for a good first experience)

the change of structure will make a changeset that is I think pretty orthogonal to those considerations and they are not complicated but not trivial either

does github/vercel give playground links for all commits or just the last one ?
etrepum — 7/1/25, 8:49 AM
I think all of them but I’ve only ever tried to use the latest one
etrepum — 7/1/25, 9:21 AM
Looks like there's some sort of build failure with the playground, I don't have access to see anything in vercel's console but all of the tests also fail with build related errors too
inkie
OP
 — 7/1/25, 9:33 AM
i am looking into it. there are probably some things I can fix. I forgot to run a full test-unit (only launched on lexical-code) and get errors there. But there are errors I don't understand like 

LexicalNode should implement "importJSON" method to ensure JSON and default HTML serialization works as expected which seem to be linked to https://github.com/facebook/lexical/commit/c85a5429e53409b3f9bb5d280a1837ca26312431
maybe "import {axe, toHaveNoViolations} from 'jest-axe';
                                             ~~
    packages/lexical-react/src/tests/unit/LexicalContentEditableElement.test.tsx:243:21 - error TS2339: Property 'toHaveNoViolations' does not exist on type 'JestMatchers<any>'." are related to that also
inkie
OP
 — 7/1/25, 9:55 AM
hum that is not very clear to me.
 
the "packages/lexical-markdown/src/tests/unit/LexicalMarkdown.test.ts" warnings I get also on main branch, but maybe they are just warnings

npm run build works on main, but not on my code-shiki branch :

tmp/lexical/node_modules/rollup/dist/shared/parseAst.js:285
    const errorInstance = Object.assign(new Error(base.message), base);
                                        ^

Error [RollupError]: Invalid value for option "output.file" - when building multiple chunks, the "output.dir" option must be used, not "output.file". To inline dynamic imports, set the "inlineDynamicImports" option.
    at getRollupError (/home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/parseAst.js:285:41)
    at Object.error (/home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/parseAst.js:281:42)
    at validateOptionsForMultiChunkOutput (/home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/rollup.js:20516:28)
    at Bundle.generate (/home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/rollup.js:20408:17)
    at async /home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/rollup.js:22084:27
    at async catchUnfinishedHookActions (/home/jwagner/tmp/lexical/node_modules/rollup/dist/shared/rollup.js:21517:16)
    at async build (/home/jwagner/tmp/lexical/scripts/build.js:268:20)
    at async buildAll (/home/jwagner/tmp/lexical/scripts/build.js:413:9) {
  code: 'INVALID_OPTION',
  url: 'https://rollupjs.org/configuration-options/#output-dir'

it looks it would be because of the "await import" calls I added ; it works on DEV but maybe needs something special on the build PROD. I must admit I am not familiar with this
also I needed to change jest configuration with https://github.com/facebook/lexical/pull/7662/files#diff-1e058ca1442e46581b13571fb8d261f9e1f5657e26c96634d4c1072f0f0347f1 to be able to launch unit tests . on this also I must admit I was just happy the conversions ended up working but don't know exactly what i am doing
inkie
OP
 — 7/1/25, 10:08 AM
@etrepum do we agree that to have async loading of languages & themes in the build, we need to output several chunks and use https://rollupjs.org/configuration-options/#output-dir instead of a single file ?
inkie
OP
 — 7/1/25, 10:25 AM
ok well I'm glad I tried pushing this PR, there is a whole packaging issue to solve that I did not take into account as everything was working with npm run dev. buildAll in scripts/build.js does not manage to build my lexical-code version that has dynamic imports. 
etrepum — 7/1/25, 10:38 AM
Yeah currently the only package that’s allowed to have more than one exported module is @lexical/react. Like discussed before the highlighter stuff should probably be in a separate package and we can accommodate multiple modules there ⁠q-and-a⁠view code diff in CodeBlock
I would also recommend minimizing any changes to the prism stuff. The reason that’s there is for backwards compatibility, I don’t think we want to really maintain improvements to both engines long term
inkie
OP
 — 7/1/25, 10:56 AM
yes that's what I have a hard time envisioning : prism v2 is doing a lot of work to improve its shortcomings and different engines have different language support; that's why I was trying to find a middle ground between refactoring to have some engine symmetry while keeping the code nearly untouched (apart from the language loading & theme). I did not intend to change more things in Prism support but that is maybe already too much I don't know.

I will see how I can move things to lexical/code-shiki if we can have multiple modules there. should things related to prism stay in lexical-code or also move to lexical/code-prism ?
etrepum — 7/1/25, 12:06 PM
I think for the first iteration (Prism) things should stay in lexical-code because for backwards compatilbility it will need to at least be a dependency anyway 
Since prism hasn't been really updated in many years I wouldn't expect Prism v2 any time soon nor would I expect that its API (at the level we use it) would remain substantially the same, so that would make sense in a separate module as well if it was supported
inkie
OP
 — 7/2/25, 5:04 AM
@etrepum ok I will revert some of the changes I made for Prism when I tried to "align" both highlighters and leave Prism implementation in lexical-code.
regarding shiki when you refer to "lexical/code-shiki" can you confirm in main src you refer to a new package "packages/lexical-code-shiki" or "packages/lexical/src/code-shiki" ? I understand it as "packages/lexical-code-shiki" that will publish "lexical/code-shiki" but I prefer to be sure before moving things
etrepum — 7/2/25, 8:50 AM
Yes I mean a new package in packages/lexical-code-shiki
etrepum — 7/2/25, 9:51 AM
https://lexical.dev/docs/maintainers-guide has some information about package structure
Maintainers' Guide | Lexical
This is the grimoire of arcane knowledge covering the overall organization
inkie
OP
 — 7/2/25, 11:04 AM
ok thanks i'll look at that. I pushed a new version that may pass the build step to at least see something in the playground
it also re-organizes code to create lexical/code-shiki
inkie
OP
 — 7/2/25, 11:11 AM
@etrepum on an old chrome browser I get "Uncaught SyntaxError: Invalid flags supplied to RegExp constructor 'v'" which seems to come from 
XW.bugNestedClassIgnoresNegation=new RegExp("[[^a]]","v")
does that ring a bell to you ?
same error on an old firefox browser
inkie
OP
 — 7/2/25, 11:22 AM
ok it could be coming from shiki javascript-engine out of https://github.com/slevithan/oniguruma-to-es/blob/main/src/utils.js#L33 ; not sure yet why I don't run into it locally vs Error on https://lexical-playground-4h9upl7q6-fbopensource.vercel.app/
inkie
OP
 — 7/2/25, 11:39 AM
ok I get a sort of similar error locally if I create the javascript engine with {target: 'ES2024'} (not at load time but when I type the first char in code mode). I don't get the error with {target: 'ES2018'}

/**
   
The target ECMAScript version.*
Oniguruma-To-ES uses RegExp features from later versions of ECMAScript to add support for a
few more grammars. If using target ES2024 or later, the RegExp v flag is used which
requires Node.js 20+ or Chrome 112+.
@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets*
For maximum compatibility, you can set it to ES2018 which uses the RegExp u flag.*
Set to auto to automatically detect the latest version supported by the environment.*
@default 'auto'*/
target?: 'auto' | 'ES2025' | 'ES2024' | 'ES2018'
so I guess that it works on my machine because, of course, I am using node 19 for whatever reason and pre-compiled languages in auto mode probably lands on ES2018

in the playground, auto mode probably lands on a higher version, compiles the language with the "v" flag which then breaks the build in my old browser..let's talk about backward compatibility 😉
inkie
OP
 — 7/2/25, 11:50 AM
hum no pushing 'ES2018' did not fix the issue on playground, still get the "invalid flags supplied to RegExp constructor 'v'" ; maybe it is because of the pre-bundled languages. I'll go try on my downstairs more recent PC
inkie
OP
 — 7/2/25, 12:05 PM
@etrepum - ok I tested on a recent PC and the playground seems to work with shiki ; even the dynamic loading works so the script/build.js patch managed to pass this step on the vercel dev playground 🙂 
I still have to understand why the npm run dev playground works on my browser but not the github vercel playground 😵‍💫 
etrepum — 7/2/25, 1:32 PM
Vercel doesn’t use npm run dev, it’s a built version
etrepum — 7/2/25, 2:31 PM
It uses this script
    "build-vercel": "(cd ../../ && node ./scripts/build.js) && npm run build-dev",

I'm pretty sure it runs the equivalent of preview (but just by specifying the build output directory to vercel)

So to repro this locally you would do something like (from the root):
npm run -w packages/lexical-playground build-vercel && npm run -w packages/lexical-playground preview
inkie
OP
 — 7/3/25, 11:02 AM
@etrepum it was a a bit painful but I have an explanation for the problem.

onigurami-to-es has a feature detection algorithm with something along the lines of 
envFlags.unicodeSets: (() => { try { new RegExp('', 'v'); } catch { return false; } return true; })(),
envFlags.bugNestedClassIgnoresNegation = envFlags.unicodeSets && new RegExp('[[^a]]', 'v').test('a');

in npm run dev the code is executed as is. on my old browser, unicodeSets => false and the new RegExp('[[^a]]', 'v').test('a') is never executed => feature detection works => shiki works

but in vercel build, executed in node, some of the code gets optimized out and main.js has something along the line of
envFlags.unicodeSets: true,
envFlags.bugNestedClassIgnoresNegation = new RegExp('[[^a]]', 'v').test('a');

when this arrives on my old browser, it breaks because the "v" flag does not exist => execution is stopped with an Error

I don't know why the pipeline does these static optimizations but do not go as far as optimizing new RegExp('[[^a]]', 'v').test('a'); to true 

I could propose a patch to oniguruma-to-es to add a try/catch block that would protect against leftover code after optimization that cannot be executed on the browser but should they expect that part of their code will be executed on a js engine and another part on another js engine ?

It seems to me that these feature/bug detections should happen in the target renderer so they should not be optimized so heavily by the lexical build system.
Even if I could understand the problem, I don't really see where these optimizations are done (esbuild? babel? rollup?) and how they can be configured to disable heavy optimization of "oniguruma-to-es"

are you familiar with this ? 
etrepum — 7/3/25, 11:17 AM
Certainly not off the top of my head. Usually there’s something that can be done, but the trick of course is to figure out what is responsible for the optimization so it can be tuned for that file or block
inkie
OP
 — 7/3/25, 11:24 AM
it could be rollup as this issue seems pretty close to our problem ; trying right now with the rollup.treeshake = false option to see if this de-optimizes oniguruma-to-es - https://github.com/rollup/rollup/issues/2181 
inkie
OP
 — 7/3/25, 11:37 AM
hum. rollup does some of the optimizations, but is only part of the problem. do you know if there is a magic boolean that would help debugging the build pipeline ?
etrepum — 7/3/25, 12:20 PM
I'm not aware of any good way to debug the build pipeline other than attaching a debugger in the right place and/or adding console.log statements. Not really a lexical specific thing, the way that vite/rollup/babel/etc. all interact is just not easy to analyze.
inkie
OP
 — 7/8/25, 10:36 AM
ok i finally found a workaround for the optimization problem. the problem was not coming from the vite configuration but from script/build.js where rollup by default was asked for the 'smallest' preset

    <// This ensures PrismJS imports get included in the bundle
    <treeshake: name !== 'Lexical Code' ? 'smallest' : false,
    >// Lexical Code: this ensures PrismJS imports get included in the bundle
    >// Lexical Code Shiki: 'recommended' preset has treeshake.tryCatchDeoptimization: true which avoids
    >//                     feature detection of oniguruma-to-es to be optimized out and cause a bug
    >treeshake: ['smallest', false, 'recommended'][
    >  1 + ['Lexical Code', 'Lexical Code Shiki'].indexOf(name)
    >],


what do you think should be the next step ?
 
finalize the "flat layout" with e2e tests and try to have it accepted upstream (I read somewhere that you once tried to have the lazy loading prism support accepted but that facebook had a problem with it ?)
implement the "tree layout" for shiki and then only have all the tests pass
work on the "configurability" of shiki (pre-loading / config of some languages, themes) ; possibility to work with wasm (?)

I ask because updating e2e tests for shiki is going to be painful with all the theme style attributes. Maybe I should force a theme in the tests instead of relying on the "default theme" to avoid having all the tests break if the default theme is changed (?)
etrepum — 7/8/25, 10:53 AM
I'm not quite clear on what flat layout vs tree layout is referring to here? I think what should probably be done is have most of the shiki e2e tests be separate from the prism ones (so the prism ones largely pass unchanged from today). I think it would be fine for the tests to specify some specific theme.

I don't think the wasm support is very high priority, it mostly makes sense server-side since the module is so large and that's just not the primary use case.

I wouldn't be worried about facebook in this case so long as it doesn't affect prism.
inkie
OP
 — 7/8/25, 11:49 AM
by "flat" versus "tree" I meant that I originally had the intent to have shiki have a "non-flat" lexical node layout. Prism has Array<LineBreakNode, TabNode, CodeHighlightNode>. Shiki could have Array<CodeLineNode> where CodeLineNode is Array<TabNode,CodeHighlightNode>.
Such a change could lead to a different gutter implementation and easier line detection/styling. maybe it could lead to a faster diff I am not sure (?)

regarding the backward compat of Prism I understand. 
how to you see the e2e tests handle both shiki & prism ? e2e test seem to run tests against the playground and the playground can only have 1 codehighlighting plugin activated. Should I add a setting to the playground so that it can run Prism or Shiki depending on this setting ?
etrepum — 7/8/25, 12:52 PM
yes the playground would have an option that controls which highlight plugin is used (could even be three - no highlight, prism, or shiki). The default would be prism for compatibility with existing e2e
the e2e tests call initialize which sets up the appSettings that are passed on the URL when rendering the playground
inkie
OP
 — 7/9/25, 10:43 AM
@etrepum appSettings.js & setupEnv.ts are enforcing a boolean only type of settings. I can propose
(isCodeHighlighterPrism/isCodeHighlighterShiki)=(true,false) as default settings.
setupEnv could check that at most one of them is true. When both are true, isCodeHighlighterShiki would be forced to false
when both are false, it would lead to the "no highlight" mode that you mentioned

is this ok for you ?
etrepum — 7/9/25, 1:42 PM
In that case I would make it a highlight on/off and shiki on/off
There’s no way we would ship three highlighters and presumably prism will be deprecated some time after shiki is fully integrated
inkie
OP
 — 7/9/25, 2:06 PM
ok so i would go with 'isCodeHighlighted' (default true) and 'isCodeShiki' (default false) or what you just said mean you prefer the naming isHighlight & isShiki which is more concise ?
etrepum — 7/9/25, 2:44 PM
Your names look good to me
Agreed that those should be the defaults to reflect existing behavior
inkie
OP
 — 7/10/25, 9:26 AM
@etrepum I have weird errors when launching npm run test-unit LexicalTableNode on my branch. I just checked and have the same errors on main (no modification) + I have a hard time seeing how it could be related to what I am doing.
basically, in packages/lexical-table/src/tests/unit/LexicalTableNode.test.tsx L229 there is a call to update (discrete:true) to add styles to table elements and just after that the test fails because the table elements seem to have disappeared in the html.
If I remove this call to update, the tables are present in the html (just not modified so the test fail farther down the line)
Have you already hit this kind of bug ? I have those test failing both locally on my machine & in the shiki PR - https://github.com/facebook/lexical/actions/runs/16195707053/job/45721536195#step:6:1466
etrepum — 7/10/25, 9:49 AM
Those yjs errors make me think theres a problem with the package.json / package-lock.json having multiple versions of yjs installed will cause that
inkie
OP
 — 7/10/25, 9:51 AM
ok thanks. in fact I just did a full npm install after removing node_modules and it seems to work on main.
so I may have modified some dependencies in package-lock.json while I was installing shiki & debugging the rollup/vite optimization.
I will try reinstalling everything starting with the upstream package-lock.json
thanks
inkie
OP
 — 7/10/25, 10:47 AM
@etrepum I may have at one point done a npm install after removing package-lock.json. Sorry for the noise on this.

This is now fixed. The PR is not finished, but it passes the tests.

 
The playground is now bound on Prism by default. The Prism tests continue to pass. There are 3 small modifications on the Prism test (so 3 things that are not perfectly backwards compatible) because of the evolution of CodeNode to handle both engines. cf https://github.com/facebook/lexical/pull/7662/files#diff-8cfe7f5aec26b0b2b3d90bc919e6c170e70387e42d52fcd39bb52d1028f534c3

highlighting or shiki can be activated via url ?isCodeHighlighted=true/false / ?isCodeShiki=true/false or via the playground settings menu. I had to make the font a little bit smaller to have all settings on one page on my screen

For now I removed all pre-loading of languages/themes for shiki. they are always lazy.

For now there are no tests related to shiki. I checked that the tab tests pass, but did not yet create a shiki instance of these and did not copy the tests that rely on tokenization as I wait to see what we decide regarding the Lexical Nodes layout that could amplify the diff.

The lexical-code 's Prism implementation still has the split of files that I initially did. If you think it is better for the future acceptation of the PR I can rollback some of it to make the diff look less important. Viewing the diff would probably be easier for the reviewers. I did that split initially to go in the direction of a pluggable CodeHighligher where people could bring their own highlighter easily by simply implementing a Facade{Engine}.
After discussing with you I feel like I should do a rollback of this regarding Prism and stick with most of the old code even if this was mostly code reorg. Tell me what you think is best for the project.
etrepum — 7/10/25, 10:49 AM
I'll try and take a look later today. I think moving some prism code around is fine (eventually it will be moved out to its own optional package) as long as the code itself doesn't change in material ways.
inkie
OP
 — 7/10/25, 3:02 PM
@etrepum for info I fixed the windows build with your hint & added the passing Tabs tests for shiki as an example for the need of the modification in jest.config.js ; I could not find a better way to have jest work alongside with shiki. the npm_modules_transformed array in jest.config.js was built manually solving error after error until jest accepted to run.
inkie
OP
 — 7/10/25, 4:11 PM
I also forgot to tell you regarding backward compatibility that there are small modifications in the tests of LexicalMarkdown https://github.com/facebook/lexical/pull/7662/files#diff-9a0c91bc82f2693a031ebe1165316e9726980b7f1d54de8681de1256e1d18303 since the data-highlight-language attr cannot be known right upon creation (CodeNode would have to have access to the highlighting engine in order to know if the language is loaded or not). In any case we cannot fill the attribute at this stage for not-yet-loaded languages
inkie
OP
 — 7/11/25, 10:32 AM
@etrepum I am doing some research on the Lexical Node Layout for CodeBlocks & corresponding HTML layout.
From what I see regarding the HTML layout, for 1 line,
vscode has 
<div style="top:76px;height:19px;line-height:19px;" class="view-line">
  <span>
    <span class="mtk6">let</span>
    <span class="mtk1">&nbsp;</span>
    <span class="mtk10">i</span>
    <span class="mtk1">&nbsp;</span>
    <span class="mtk3">=</span>
    <span class="mtk1">&nbsp;</span>
    <span class="mtk7">5</span>
    <span class="mtk1">;&nbsp;&nbsp;&nbsp;</span>
  </span>
</div>

discord has a div>span>span>span structure seemingly using highlight.js for their editable widget
<div class="codeLine_ada32f" spellcheck="false" data-slate-node="element">
  <span data-slate-node="text">
    <span data-slate-leaf="true" class="">
      <span data-slate-string="true">    </span>
    </span>
    <span data-slate-leaf="true" class="hljs-tag">
      <span data-slate-string="true">&lt;</span>
    </span>
    ...
  </span>
</div>

codemirror on https://codemirror.net/ seem to have div>span|text structure
<div class="cm-activeLine cm-line">
  <span class="ͼb">function</span> 
  <span class="ͼg">hello</span>
  (
  <span class="ͼg">who</span>
  =
  <span class="ͼe">"world"</span>
  ) {
</div>
etrepum — 7/11/25, 10:36 AM
div makes sense for lines, I imagine the structure was driven more by how prism works than anything else
inkie
OP
 — 7/11/25, 11:09 AM
I don't know exactly what are the risks of changing things now - I have never really worked with ContentEditable and its quirks.
shiki outputs lines ; I forced them into the flat structure coming from the prism integration. but that has some shortcomings (mainly gutter ; hard to style a true line for diff)
do you think it could lead to improvements to have a Lexical HTML "div>span* div>span" instead of the current "span br span* br span". Should that be parallel to a change of the internal Lexical nodes, with a new CodeLineNode ? 
I think I don't know enough of Lexical to measure what is good for the future of code support inside Lexical.

Also, I am trying to see what "new" feature could maybe spin out of the work we're doing. I was wondering about the support of inline code snippets that do not seem to be supported currently (are they ?). a div>span>span html structure could probably be reused as span>span* for inline snippets. but I am theorizing here and don't know enough of Lexical to know what is the right thing to do

For information I also saw that there is a way to extract the "scopes" of the styling decisions inside shiki - 
/**
   * Include explanation of why a token is given a color.
   *
   * You can optionally pass `scopeName` to only include explanation for scopes,
   * which is more performant than full explanation.
   *
   * @default false
   */
  includeExplanation?: boolean | 'scopeName'

I used the legacy token "type" to keep the inserted/deleted/unchanged but maybe it is a feature to also have the scopes in the lexical tree
also shiki has this whole "css trick" to be able to embed several themes in attr.style. They mainly market it for light mode / dark mode, but you can in fact have as many themes rendered as you want - cf https://shiki.matsu.io/guide/dual-themes for an intro
etrepum — 7/11/25, 11:20 AM
Honestly it’s hard to know exactly what will happen until you try it in all three of the browsers. Tiny CSS differences can have an impact on how the browser natively handles selection, input, keyboard navigation, etc. Any structure can work the only question is how much you have to override by writing code in lexical. Might be nothing that is not already done, but wouldn’t be able to say without having it running. There’s no real spec for any of these contentEditable aspects.
The use case of line numbers seems compelling enough to make it work one way or another. I’m not sure if having all of the LineBreakNodes go away or not is better or worse without trying it (css could be used to disable their effect inside of a CodeLineNode if they are left in)
inkie
OP
 — 7/11/25, 11:26 AM
would it make sense contentEditable wise and regarding the work that has already been put into numbered list in Lexical to consider that "code" is in fact a numbered list ? numbering could come for "free" out of css 
inkie
OP
 — 7/11/25, 12:00 PM
ok I need to dig a little further into how DOM is exported/imported.
etrepum — 7/11/25, 12:38 PM
I don't think so, the numbering of ordered lists is all just css counters under the hood anyway, no reason you can't implement that for other nodes. The tags don't really matter (other than their default css), better to have them be more semantic than less. It's really the rendered css that determines how the browser behaves.
inkie
OP
 — 7/11/25, 3:56 PM
@etrepum I modified title/description on https://github.com/facebook/lexical/pull/7662 ; tell me if you think I should amend something. thanks!
etrepum — 7/11/25, 4:57 PM
Looks good to me! just waiting on feedback from other maintainers
inkie
OP
 — 7/12/25, 6:02 AM
@etrepum I found a code highlighting bug that is currently present in main :
>let i = 6;
>

with the cursor set on the last line (">" means start-of-line). If you then change the language to markdown, the tokenization has less tokens and it leads to an error in console :
DOMException: Failed to execute 'setBaseAndExtent' on 'Selection': There is no child at offset 7.

I understand why there could be a bug when tokens are pulled from under the selection but am now sure where/how this should be fixed.
Also not sure if this is a good idea to add a commit to the PR before we get feedback. Maybe this should be a bugfix PR as it impacts main 
also I saw a small bug regarding shiki/prism back&forth :
 
if you activate shiki, the background gets a style color from the theme
if you then deactivate shiki, the background wrongly keeps its style color I guess because Prism does not set style='' on CodeNode
Not sure if this is worth fixing
etrepum — 7/12/25, 8:10 AM
I would say not worth fixing the lingering style in this PR. The selection issue on main can be addressed separately.
You can report the selection issue as a bug since you have a repro for it
etrepum — 7/14/25, 4:49 PM
So far the feedback was mostly isolated to CodeNode constructor compatibility which I went ahead and addressed. I also moved the default shiki theme out of lexical-code and narrowed the type of __theme to not include null. Will probably take the rest of the week for some other folks at meta to have a look but it's looking like this can ship sooner than later
inkie
OP
 — 7/15/25, 3:24 AM
@etrepum great news thanks ! for information I will be around here until thurday July 17th but then i'll be afk up to ~Aug 5th
