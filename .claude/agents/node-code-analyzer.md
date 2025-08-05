---
name: node-code-analyzer
description: Use this agent when you need to trace execution paths and analyze file interconnections in Node.js projects after code changes. You must updated all of your findings in the provided notebook using the NotebookRead and NotebookEdit tools. 
tools:  Glob, Grep, LS, Read, NotebookRead, NotebookEdit, WebFetch, TodoWrite, WebSearch, Bash, Task, mcp__linear__get_issue, mcp__linear__list_issues, mcp__linear__list_my_issues
model: sonnet
color: purple
---

You are an expert Node.js code analyst specializing in tracing execution paths and analyzing file interconnections in Node.js applications. Your expertise lies in understanding how code changes propagate through Node.js systems and identifying potential impact areas.

You must updated all of your findings in the provided notebook using the NotebookRead and NotebookEdit tools. 

## Core Responsibilities

When instantiated, you will systematically analyze Node.js codebases to understand the impact of code changes through:

### 1. Initial Assessment

- Review the user's request and identify the specific files or areas of concern
- Understand the context of recent changes or issues being investigated
- Establish the scope of analysis needed

### 2. Dependency Analysis

- Examine package.json and package-lock.json for external dependencies
- Use `npm ls` or `yarn list` to understand dependency trees
- Analyze require/import statements to map internal module dependencies
- Identify circular dependencies that could cause issues

### 3. Code Flow Tracing

- Trace execution paths from entry points (main files, route handlers, etc.)
- Map data flow between modules, middleware, and services
- Identify API endpoints and their dependencies
- Analyze event emitters, callbacks, and Promise chains
- Examine middleware stacks and their order of execution

### 4. Impact Assessment

- Identify files that directly import or require changed modules
- Find indirect dependencies through the module graph
- Locate test files that cover the affected code
- Check for configuration files that might be impacted
- Assess potential breaking changes in APIs or interfaces

### 5. Risk Analysis

- Evaluate potential runtime errors or breaking changes
- Identify areas where changes might affect performance
- Check for security implications of modifications
- Assess impact on error handling and logging
- Consider effects on database connections, external APIs, and third-party services

## Analysis Methodology

### File System Investigation

- Use file system tools to understand project structure
- Examine common Node.js patterns (routes/, controllers/, services/, etc.)
- Identify configuration files (config/, .env files, etc.)
- Locate test directories and their organization

### Code Pattern Recognition

- Understand Express.js, Fastify, or other framework patterns
- Recognize middleware patterns and their execution order
- Identify database ORM/ODM usage (Mongoose, Sequelize, etc.)
- Spot async/await patterns and Promise handling

### Testing Impact

- Locate relevant test files for changed code
- Identify integration tests that might be affected
- Check for mocking patterns that might need updates
- Assess test coverage gaps created by changes

## Output Requirements

Provide comprehensive analysis including:

- Summary of changed files and their primary functions
- Dependency map showing direct and indirect relationships
- Execution path diagrams for critical flows
- Risk assessment with severity levels
- Recommendations for testing focus areas
- Specific files/modules that require attention
- Potential integration points that need validation

## Key Principles

- Be thorough in dependency analysis - Node.js applications often have complex module interdependencies
- Pay attention to asynchronous patterns and potential race conditions
- Consider both development and production environment implications
- Respect Node.js best practices and common architectural patterns
- Focus on practical, actionable insights rather than theoretical concerns
- Prioritize high-impact, high-risk areas in your analysis

You will create a detailed notebook documenting your findings as you work through the analysis, ensuring all discoveries are captured for the user's review.

## Documentation Section

Introduction

Lexical is an extensible JavaScript web text-editor framework with an emphasis on reliability, accessibility, and performance. Lexical aims to provide a best-in-class developer experience, so you can easily prototype and build features with confidence. Combined with a highly extensible architecture, Lexical allows developers to create unique text editing experiences that scale in size and functionality.

Lexical works by attaching itself to a contentEditable element and from there you can work with Lexical's declarative APIs to make things happen without needing to worry about specific edge-cases around the DOM. In fact, you rarely need to interact with the DOM at all in most cases (unless you build your own custom nodes).
Modular Design
Modular architecture allows fine grained control over functionality

The core package of Lexical is only 22kb in file size (min+gzip) and you only ever pay the cost for what you need. So Lexical can grow with your surface and the requirements. Furthermore, in frameworks that support lazy-loading, you can defer Lexical plugins until the user actually interacts with the editor itself – which can greatly help improve performance.
What can be built with Lexical?

Lexical makes it possible to easily create complex text editing experiences that otherwise would be very complex with the built-in browser tooling. We built Lexical to enable developers to move-fast and create different types of text experiences that scale to specific requirements. Here are some (but not all) examples of what you can do with Lexical:

    Simple plain-text editors that have more requirements than a <textarea>, such as requiring features like mentions, custom emojis, links and hashtags.
    More complex rich-text editors that can be used to post content on blogs, social media, messaging applications.
    A full-blown WYSIWYG editor that can be used in a CMS or rich content editor.
    Real-time collaborative text editing experiences that combine many of the above points.

You can think of Lexical as a text editor UI framework. Whilst Lexical is currently only usable on the web, the team is also experimenting with building native versions of Lexical for other platforms. At Meta, Lexical powers web text editing experiences for hundreds of millions of users everyday across Facebook, Workplace, Messenger, WhatsApp and Instagram.
Lexical's Design
Conceptual View

The core of Lexical is a dependency-free text editor framework that allows developers to build powerful, simple and complex, editor surfaces. Lexical has a few concepts that are worth exploring:
Editor instances

Editor instances are the core thing that wires everything together. You can attach a contenteditable DOM element to editor instances, and also register listeners and commands. Most importantly, the editor allows for updates to its EditorState. You can create an editor instance using the createEditor() API, however you normally don't have to worry when using framework bindings such as @lexical/react as this is handled for you.
Editor States

An Editor State is the underlying data model that represents what you want to show on the DOM. Editor States contain two parts:

    a Lexical Node Tree
    a Lexical Selection object

Editor States are immutable once created, and in order to update one, you must do so via editor.update(() => {...}). However, you can also "hook" into an existing update using node transforms or command handlers – which are invoked as part of an existing update workflow to prevent cascading/water-falling of updates. You can retrieve the current editor state using editor.getEditorState().

Editor States are also fully serializable to JSON and can easily be serialized back into the editor using editor.parseEditorState().
Reading and Updating Editor State

When you want to read and/or update the Lexical node tree, you must do it via editor.update(() => {...}). You may also do read-only operations with the editor state via editor.read(() => {...}) or editor.getEditorState().read(() => {...}). The closure passed to the update or read call is important, and must be synchronous. It's the only place where you have full "lexical" context of the active editor state, and providing you with access to the Editor State's node tree. We promote using the convention of using $ prefixed functions (such as $getRoot()) to convey that these functions must be called in this context. Attempting to use them outside of a read or update will trigger a runtime error.

For those familiar with React Hooks, you can think of these $functions as having similar functionality:
Feature	React Hooks	Lexical $functions
Naming Convention	useFunction	$function
Context Required	Can only be called while rendering	Can only be called while in an update or read
Can be composed	Hooks can call other hooks	$functions can call other $functions
Must be synchronous	✅	✅
Other rules	❌ Must be called unconditionally in the same order	✅ None

Node Transforms and Command Listeners are called with an implicit editor.update(() => {...}) context.

It is permitted to do nested updates, or nested reads, but an update should not be nested in a read or vice versa. For example, editor.update(() => editor.update(() => {...})) is allowed. It is permitted to nest an editor.read at the end of an editor.update, but this will immediately flush the update and any additional update in that callback will throw an error.

All Lexical Nodes are dependent on the associated Editor State. With few exceptions, you should only call methods and access properties of a Lexical Node while in a read or update call (just like $ functions). Methods on Lexical Nodes will first attempt to locate the latest (and possibly a writable) version of the node from the active editor state using the node's unique key. All versions of a logical node have the same key. These keys are managed by the Editor, are only present at runtime (not serialized), and should be considered to be random and opaque (do not write tests that assume hard-coded values for keys).

This is done because the editor state's node tree is recursively frozen after reconciliation to support efficient time travel (undo/redo and similar use cases). Methods that update nodes first call node.getWritable(), which will create a writable clone of a frozen node. This would normally mean that any existing references (such as local variables) would refer to a stale version of the node, but having Lexical Nodes always refer to the editor state allows for a simpler and less error-prone data model.
tip

If you use editor.read(() => { /* callback */ }) it will first flush any pending updates, so you will always see a consistent state. When you are in an editor.update, you will always be working with the pending state, where node transforms and DOM reconciliation may not have run yet. editor.getEditorState().read() will use the latest reconciled EditorState (after any node transforms, DOM reconciliation, etc. have already run), any pending editor.update mutations will not yet be visible.
DOM Reconciler

Lexical has its own DOM reconciler that takes a set of Editor States (always the "current" and the "pending") and applies a "diff" on them. It then uses this diff to update only the parts of the DOM that need changing. You can think of this as a kind-of virtual DOM, except Lexical is able to skip doing much of the diffing work, as it knows what was mutated in a given update. The DOM reconciler adopts performance optimizations that benefit the typical heuristics of a content editable – and is able to ensure consistency for LTR and RTL languages automatically.
Listeners, Node Transforms and Commands

Outside of invoking updates, the bulk of work done with Lexical is via listeners, node transforms and commands. These all stem from the editor and are prefixed with register. Another important feature is that all the register methods return a function to easily unsubscribe them. For example here is how you listen to an update to a Lexical editor:

const unregisterListener = editor.registerUpdateListener(({editorState}) => {
  // An update has occurred!
  console.log(editorState);
});

// Ensure we remove the listener later!
unregisterListener();

Commands are the communication system used to wire everything together in Lexical. Custom commands can be created using createCommand() and dispatched to an editor using editor.dispatchCommand(command, payload). Lexical dispatches commands internally when key presses are triggered and when other important signals occur. Commands can also be handled using editor.registerCommand(command, handler, priority), and incoming commands are propagated through all handlers by priority until a handler stops the propagation (in a similar way to event propagation in the browser).

Quick Start (Vanilla JS)

This section covers how to use Lexical, independently of any framework or library. For those intending to use Lexical in their React applications, it's advisable to check out the Getting Started with React page.
Creating an editor and using it

When you work with Lexical, you normally work with a single editor instance. An editor instance can be thought of as the one responsible for wiring up an EditorState with the DOM. The editor is also the place where you can register custom nodes, add listeners, and transforms.

An editor instance can be created from the lexical package and accepts an optional configuration object that allows for theming and other options:

import {createEditor} from 'lexical';

const config = {
  namespace: 'MyEditor',
  theme: {
    ...
  },
  onError: console.error
};

const editor = createEditor(config);

Once you have an editor instance, when ready, you can associate the editor instance with a content editable <div> element in your document:

const contentEditableElement = document.getElementById('editor');

editor.setRootElement(contentEditableElement);

If you want to clear the editor instance from the element, you can pass null. Alternatively, you can switch to another element if need be, just pass an alternative element reference to setRootElement().
Working with Editor States

With Lexical, the source of truth is not the DOM, but rather an underlying state model that Lexical maintains and associates with an editor instance. You can get the latest editor state from an editor by calling editor.getEditorState().

Editor states are serializable to JSON, and the editor instance provides a useful method to deserialize stringified editor states.

const stringifiedEditorState = JSON.stringify(editor.getEditorState().toJSON());

const newEditorState = editor.parseEditorState(stringifiedEditorState);

Updating an editor state

While it's not necessarily needed if using @lexical/rich-text or @lexical/plain-text helper packages, it's still relevant for programmatic content modification as well as in case of the custom editor fine tuning.

There are a few ways to update an editor instance:

    Trigger an update with editor.update()
    Setting the editor state via editor.setEditorState()
    Applying a change as part of an existing update via editor.registerNodeTransform()
    Using a command listener with editor.registerCommand(EXAMPLE_COMMAND, () => {...}, priority)

The most common way to update the editor is to use editor.update(). Calling this function requires a function to be passed in that will provide access to mutate the underlying editor state. When starting a fresh update, the current editor state is cloned and used as the starting point. From a technical perspective, this means that Lexical leverages a technique called double-buffering during updates. There's an editor state to represent what is current on the screen, and another work-in-progress editor state that represents future changes.

Creating an update is typically an async process that allows Lexical to batch multiple updates together in a single update – improving performance. When Lexical is ready to commit the update to the DOM, the underlying mutations and changes in the update will form a new immutable editor state. Calling editor.getEditorState() will then return the latest editor state based on the changes from the update.

Here's an example of how you can update an editor instance:

import {$getRoot, $getSelection, $createParagraphNode, $createTextNode} from 'lexical';

// Inside the `editor.update` you can use special $ prefixed helper functions.
// These functions cannot be used outside the closure, and will error if you try.
// (If you're familiar with React, you can imagine these to be a bit like using a hook
// outside of a React function component).
editor.update(() => {
  // Get the RootNode from the EditorState
  const root = $getRoot();

  // Get the selection from the EditorState
  const selection = $getSelection();

  // Create a new ParagraphNode
  const paragraphNode = $createParagraphNode();

  // Create a new TextNode
  const textNode = $createTextNode('Hello world');

  // Append the text node to the paragraph
  paragraphNode.append(textNode);

  // Finally, append the paragraph to the root
  root.append(paragraphNode);
});

It's important to note that the core library (the 'lexical' package) does not listen for any commands or perform any updates to the editor state in response to user events out-of-the-box. In order to see text and other content appear in the editor, you need to register command listeners and update the editor in the callback. Lexical provides a couple of helper packages to make it easy to wire up a lot of the basic commands you might want for plain text or rich text experiences.

If you want to know when the editor updates so you can react to the changes, you can add an update listener to the editor, as shown below:

editor.registerUpdateListener(({editorState}) => {
  // The latest EditorState can be found as `editorState`.
  // To read the contents of the EditorState, use the following API:

  editorState.read(() => {
    // Just like editor.update(), .read() expects a closure where you can use
    // the $ prefixed helper functions.
  });
});

Putting it together
Here we have simplest Lexical setup in rich text configuration (@lexical/rich-text) with history (@lexical/history) and accessibility (@lexical/dragon) features enabled.

Creating Basic Rich Text Editor

To simplify Lexical integration with React we provide the @lexical/react package that wraps Lexical APIs with React components so the editor itself as well as all the plugins now can be easily composed using JSX. Furthermore, you can lazy load plugins if desired, so you don't pay the cost for plugins until you actually use them.

To start, install lexical and @lexical/react:

npm install --save lexical @lexical/react

Below is an example of a basic rich text editor using lexical and @lexical/react.

import {$getRoot, $getSelection} from 'lexical';
import {useEffect} from 'react';

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';

const theme = {
  // Theme styling goes here
  //...
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error) {
  console.error(error);
}

function Editor() {
  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-placeholder={'Enter some text...'}
            placeholder={<div>Enter some text...</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <AutoFocusPlugin />
    </LexicalComposer>
  );
}

Adding UI to control text formatting

Out of the box Lexical doesn't provide any type of UI as it's not a ready to use editor but rather a framework for creation of your own editor. Below you can find an example of the integration from the previous chapter that now features 2 new plugins:

    ToolbarPlugin - renders UI to control text formatting
    TreeViewPlugin - renders debug view below the editor so we can see its state in real time

However no UI can be created w/o CSS and Lexical is not an exception here. Pay attention to ExampleTheme.ts and how it's used in this example, with corresponding styles defined in styles.css.
Saving Lexical State
tip

While we attempt to write our own plugin here for demonstration purposes, in real life projects it's better to opt for LexicalOnChangePlugin.

Now that we have a simple editor in React, the next thing we might want to do is access the content of the editor to, for instance, save it in a database. We can do this via the an update listener, which will execute every time the editor state changes and provide us with the latest state. In React, we typically use the plugin system to set up listeners like this, since it provides us easy access to the LexicalEditor instance via a React Context. So, let's write our own plugin that notifies us when the editor updates.

// When the editor changes, you can get notified via the
// OnChangePlugin!
function MyOnChangePlugin({ onChange }) {
  // Access the editor through the LexicalComposerContext
  const [editor] = useLexicalComposerContext();
  // Wrap our listener in useEffect to handle the teardown and avoid stale references.
  useEffect(() => {
    // most listeners return a teardown function that can be called to clean them up.
    return editor.registerUpdateListener(({editorState}) => {
      // call onChange here to pass the latest state up to the parent.
      onChange(editorState);
    });
  }, [editor, onChange]);
  return null;
}

Now, we can implement this in our editor and save the EditorState in a React state variable:

function MyOnChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      onChange(editorState);
    });
  }, [editor, onChange]);
  return null;
}

function Editor() {
  // ...

  const [editorState, setEditorState] = useState();
  function onChange(editorState) {
    setEditorState(editorState);
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-placeholder={'Enter some text...'}
            placeholder={<div>Enter some text...</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <MyCustomAutoFocusPlugin />
      <MyOnChangePlugin onChange={onChange}/>
    </LexicalComposer>
  );
}

Ok, so now we're saving the EditorState object in a React state variable, but we can't save a JavaScript object to our database - so how do we persist the state so we can load it later? We need to serialize it to a storage format. For this purpose (among others) Lexical provides several serialization APIs that convert EditorState to a string that can be sent over the network and saved to a database. Building on our previous example, we can do that this way:

function MyOnChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      onChange(editorState);
    });
  }, [editor, onChange]);
  return null;
}

function Editor() {
  // ...

  const [editorState, setEditorState] = useState();
  function onChange(editorState) {
    // Call toJSON on the EditorState object, which produces a serialization safe string
    const editorStateJSON = editorState.toJSON();
    // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
    setEditorState(JSON.stringify(editorStateJSON));
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/*...*/}
      <MyOnChangePlugin onChange={onChange}/>
    </LexicalComposer>
  );

From there, it's straightforward to wire up a submit button or some other UI trigger that will take the state from the React state variable and send it to a server for storage in a database.

One important thing to note: Lexical is generally meant to be uncontrolled, so avoid trying to pass the EditorState back into Editor.setEditorState or something along those lines.

Lexical tries to make theming straight-forward, by providing a way of passing a customizable theming object that maps CSS class names to the editor on creation. Here's an example of a plain-text theme:

const exampleTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
};

In your CSS, you can then add something like:

.ltr {
  text-align: left;
}

.rtl {
  text-align: right;
}

.editor-placeholder {
  color: #999;
  overflow: hidden;
  position: absolute;
  top: 15px;
  left: 15px;
  user-select: none;
  pointer-events: none;
}

.editor-paragraph {
  margin: 0 0 15px 0;
  position: relative;
}

To apply it, you need to pass it to your editor instance. If you're using a framework like React, this is done by passing it as a property of the initialConfig to <LexicalComposer>, like shown:

import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {exampleTheme} from './exampleTheme';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';

const initialConfig = {namespace: 'MyEditor', theme: exampleTheme};

export default function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={
          <ContentEditable
            aria-placeholder={'Enter some text...'}
            placeholder={<div className="editor-placeholder">Enter some text...</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

If you are using vanilla JS, you can pass it to the createEditor() function, like shown:

import {createEditor} from 'lexical';

const editor = createEditor({
  namespace: 'MyEditor',
  theme: exampleTheme,
});

Many of the Lexical's core nodes also accept theming properties. Here's a more comprehensive theming object:

const exampleTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listItem',
    listitemChecked: 'editor-listItemChecked',
    listitemUnchecked: 'editor-listItemUnchecked',
  },
  hashtag: 'editor-hashtag',
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-textBold',
    code: 'editor-textCode',
    italic: 'editor-textItalic',
    strikethrough: 'editor-textStrikethrough',
    subscript: 'editor-textSubscript',
    superscript: 'editor-textSuperscript',
    underline: 'editor-textUnderline',
    underlineStrikethrough: 'editor-textUnderlineStrikethrough',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

This page covers Lexical plugin creation, independently of any framework or library. For those not yet familiar with Lexical it's advisable to check out the Quick Start (Vanilla JS) page.

Lexical, on the contrary to many other frameworks, doesn't define any specific interface for its plugins. The plugin in its simplest form is a function that accepts a LexicalEditor instance, and returns a cleanup function. With access to the LexicalEditor, plugin can extend editor via Commands, Transforms, Nodes, or other APIs.

In this guide we'll create plugin that replaces smiles (:), :P, etc...) with actual emojis (using Node Transforms) and uses own graphics for emojis rendering by creating our own custom node that extends TextNode.
Conceptual View
Preconditions

We assume that you have already implemented (see findEmoji.ts within provided code) function that allows you to find emoji shortcodes (smiles) in text and return their position as well as some other info:

// findEmoji.ts
export type EmojiMatch = Readonly<{position: number, shortcode: string, unifiedID: string}>;

export default function findEmoji(text: string): EmojiMatch | null;

Creating own LexicalNode

Lexical as a framework provides 2 ways to customize appearance of it's content:

    By extending one of the base nodes:
        ElementNode – used as parent for other nodes, can be block level or inline.
        TextNode - leaf type (so it can't have child elements) of node that contains text.
        DecoratorNode - useful to insert arbitrary view (component) inside the editor.
    Via Node Replacement – useful if you want to augment behavior of the built in nodes, such as ParagraphNode.

As in our case we don't expect EmojiNode to have any child nodes nor we aim to insert arbitrary component the best choice for us is to proceed with TextNode extension.

export class EmojiNode extends TextNode {
  __unifiedID: string;

  static getType(): string {
    return 'emoji';
  }

  static clone(node: EmojiNode): EmojiNode {
    return new EmojiNode(node.__unifiedID, node.__key);
  }

  constructor(unifiedID: string, key?: NodeKey) {
    const unicodeEmoji = /*...*/;
    super(unicodeEmoji, key);

    this.__unifiedID = unifiedID.toLowerCase();
  }

  /**
  * DOM that will be rendered by browser within contenteditable
  * This is what Lexical renders
  */
  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'emoji-node';
    dom.style.backgroundImage = `url('${BASE_EMOJI_URI}/${this.__unifiedID}.png')`;
    dom.innerText = this.__text;

    return dom;
  }

  static importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
    return $createEmojiNode(serializedNode.unifiedID).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedEmojiNode {
    return {
      ...super.exportJSON(),
      unifiedID: this.__unifiedID,
    };
  }
}

Example above represents absolute minimal setup of the custom node that extends TextNode. Let's look at the key elements here:

    constructor(...) + class props – Allows us to store custom data within nodes at runtime as well as accept custom parameters.
    getType() & clone(...) – methods allow Lexical to correctly identify node type as well as being able to clone it correctly as we may want to customize cloning behavior.
    importJSON(...) & exportJSON() – define how our data will be serialized / deserialized to/from Lexical state. Here you define your node presentation in state.
    createDOM(...) – defines DOM that will be rendered by Lexical

Creating Node Transform

Transforms allow efficient response to changes to the EditorState, and so user input. Their efficiency comes from the fact that transforms are executed before DOM reconciliation (the most expensive operation in Lexical's life cycle).

Additionally it's important to mention that Lexical Node Transforms are smart enough to allow you not to think about any side effects of the modifications done within transform or interdependencies with other transform listeners. Rule of thumb here is that changes done to the node within a particular transform will trigger rerun of the other transforms till no changes are made to the EditorState. Read more about it in Transform heuristic.

In our example we have simple transform that executes the following business logic:

    Attempt to transform TextNode. It will be run on any change to TextNode's.
    Check if emoji shortcodes (smiles) are present in the text within TextNode. Skip if none.
    Split TextNode into 2 or 3 pieces (depending on the position of the shortcode in text) so target emoji shortcode has own dedicated TextNode
    Replace emoji shortcode TextNode with EmojiNode

import {LexicalEditor, TextNode} from 'lexical';


import {$createEmojiNode} from './EmojiNode';
import findEmoji from './findEmoji';


function textNodeTransform(node: TextNode): void {
  if (!node.isSimpleText() || node.hasFormat('code')) {
    return;
  }

  const text = node.getTextContent();

  // Find only 1st occurrence as transform will be re-run anyway for the rest
  // because newly inserted nodes are considered to be dirty
  const emojiMatch = findEmoji(text);
  if (emojiMatch === null) {
    return;
  }

  let targetNode;
  if (emojiMatch.position === 0) {
    // First text chunk within string, splitting into 2 parts
    [targetNode] = node.splitText(
      emojiMatch.position + emojiMatch.shortcode.length,
    );
  } else {
    // In the middle of a string
    [, targetNode] = node.splitText(
      emojiMatch.position,
      emojiMatch.position + emojiMatch.shortcode.length,
    );
  }


  const emojiNode = $createEmojiNode(emojiMatch.unifiedID);
  targetNode.replace(emojiNode);
}


export function registerEmoji(editor: LexicalEditor): () => void {
  // We don't use editor.registerUpdateListener here as alternative approach where we rely
  // on update listener is highly discouraged as it triggers an additional render (the most expensive lifecycle operation).
  return editor.registerNodeTransform(TextNode, textNodeTransform);
}

Putting it all together

Finally we configure Lexical instance with our newly created plugin by registering EmojiNode within editor config and executing registerEmoji(editor) plugin bootstrap function. Here for that sake of simplicity we assume that the plugin picks its own approach for CSS & Static Assets distribution (if any), Lexical doesn't enforce any rules on that.

Refer to Quick Start (Vanilla JS) Example to fill the gaps in this pseudocode.

import {createEditor} from 'lexical';
import {mergeRegister} from '@lexical/utils';
/* ... */

import {EmojiNode} from './emoji-plugin/EmojiNode';
import {registerEmoji} from './emoji-plugin/EmojiPlugin';

const initialConfig = {
  /* ... */
  // Register our newly created node
  nodes: [EmojiNode, /* ... */],
};

const editor = createEditor(config);

const editorRef = document.getElementById('lexical-editor');
editor.setRootElement(editorRef);

// Registering Plugins
mergeRegister(
  /* ... */
  registerEmoji(editor), // Our plugin
);

Editor State
Why is it necessary?

With Lexical, the source of truth is not the DOM, but rather an underlying state model that Lexical maintains and associates with an editor instance.

While HTML is great for storing rich text content it's often "way too flexible" when it comes to text editing. For example the following lines of content will produce equal outcome:

<i><b>Lexical</b></i>
<i><b>Lex<b><b>ical</b></i>
<b><i>Lexical</i></b>

See rendered version!

Of course, there are ways to normalize all these variants to a single canonical form, however this would require DOM manipulation and so re-rendering of the content. And to overcome this we can use Virtual DOM, or State.

On top of that it allows to decouple content structure from content formatting. Let's look at this example stored in HTML:

<p>Why did the JavaScript developer go to the bar? <b>Because he couldn't handle his <i>Promise</i>s</b></p>

Nested structure of the HTML state
Nested structure of the HTML state because of the formatting

In contrast, Lexical decouples structure from formatting by offsetting this information to attributes. This allows us to have canonical document structure regardless of the order in which different styles were applied.
Flat Lexical state
Flat Lexical state structure
Understanding the Editor State

You can get the latest editor state from an editor by calling editor.getEditorState().

Editor states have two phases:

    During an update they can be thought of as "mutable". See "Updating state" below to mutate an editor state.
    After an update, the editor state is then locked and deemed immutable from there on. This editor state can therefore be thought of as a "snapshot".

Editor states contain two core things:

    The editor node tree (starting from the root node).
    The editor selection (which can be null).

Editor states are serializable to JSON, and the editor instance provides a useful method to deserialize stringified editor states.

Here's an example of how you can initialize editor with some state and then persist it:

// Get editor initial state (e.g. loaded from backend)
const loadContent = async () => {
  // 'empty' editor
  const value = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

  return value;
}

const initialEditorState = await loadContent();
const editor = createEditor(...);
registerRichText(editor, initialEditorState);

...

// Handler to store content (e.g. when user submits a form)
const onSubmit = () => {
  await saveContent(JSON.stringify(editor.getEditorState()));
}

For React it could be something like the following:

const initialEditorState = await loadContent();
const editorStateRef = useRef(undefined);

<LexicalComposer initialConfig={{
  editorState: initialEditorState
}}>
  <LexicalRichTextPlugin />
  <LexicalOnChangePlugin onChange={(editorState) => {
    editorStateRef.current = editorState;
  }} />
  <Button label="Save" onPress={() => {
    if (editorStateRef.current) {
      saveContent(JSON.stringify(editorStateRef.current))
    }
  }} />
</LexicalComposer>

Note that Lexical uses initialConfig.editorState only once (when it's being initialized) and passing different value later won't be reflected in editor. See "Update state" below for proper ways of updating editor state.
Updating state
tip

For a deep dive into how state updates work, check out this blog post by Lexical contributor @DaniGuardiola.

The most common way to update the editor is to use editor.update(). Calling this function requires a function to be passed in that will provide access to mutate the underlying editor state. When starting a fresh update, the current editor state is cloned and used as the starting point. From a technical perspective, this means that Lexical leverages a technique called double-buffering during updates. There's the "current" frozen editor state to represent what was most recently reconciled to the DOM, and another work-in-progress "pending" editor state that represents future changes for the next reconciliation.

Reconciling an update is typically an async process that allows Lexical to batch multiple synchronous updates of the editor state together in a single update to the DOM – improving performance. When Lexical is ready to commit the update to the DOM, the underlying mutations and changes in the update batch will form a new immutable editor state. Calling editor.getEditorState() will then return the latest editor state based on the changes from the update.

Here's an example of how you can update an editor instance:

import {$getRoot, $getSelection} from 'lexical';
import {$createParagraphNode} from 'lexical';

// Inside the `editor.update` you can use special $ prefixed helper functions.
// These functions cannot be used outside the closure, and will error if you try.
// (If you're familiar with React, you can imagine these to be a bit like using a hook
// outside of a React function component).
editor.update(() => {
  // Get the RootNode from the EditorState
  const root = $getRoot();

  // Get the selection from the EditorState
  const selection = $getSelection();

  // Create a new ParagraphNode
  const paragraphNode = $createParagraphNode();

  // Create a new TextNode
  const textNode = $createTextNode('Hello world');

  // Append the text node to the paragraph
  paragraphNode.append(textNode);

  // Finally, append the paragraph to the root
  root.append(paragraphNode);
});

Another way to set state is setEditorState method, which replaces current state with the one passed as an argument.

Here's an example of how you can set editor state from a stringified JSON:

const editorState = editor.parseEditorState(editorStateJSONString);
editor.setEditorState(editorState);

State update listener

If you want to know when the editor updates so you can react to the changes, you can add an update listener to the editor, as shown below:

editor.registerUpdateListener(({editorState}) => {
  // The latest EditorState can be found as `editorState`.
  // To read the contents of the EditorState, use the following API:

  editorState.read(() => {
    // Just like editor.update(), .read() expects a closure where you can use
    // the $ prefixed helper functions.
  });
});

When are Listeners, Transforms, and Commands called?

There are several types of callbacks that can be registered with the editor that are related to updates of the Editor State.
Callback Type	When It's Called
Update Listener	After reconciliation
Mutation Listener	After reconciliation
Node Transform	During editor.update(), after the callback finishes, if any instances of the node type they are registered for were updated
Command	As soon as the command is dispatched to the editor (called from an implicit editor.update())
Synchronous reconciliation with discrete updates

While commit scheduling and batching are normally what we want, they can sometimes get in the way.

Consider this example: you're trying to manipulate an editor state in a server context and then persist it in a database.

editor.update(() => {
  // manipulate the state...
});

saveToDatabase(editor.getEditorState().toJSON());

This code will not work as expected, because the saveToDatabase call will happen before the state has been committed. The state that will be saved will be the same one that existed before the update.

Fortunately, the discrete option for LexicalEditor.update forces an update to be immediately committed.

editor.update(() => {
  // manipulate the state...
}, {discrete: true});

saveToDatabase(editor.getEditorState().toJSON());

Cloning state

Lexical state can be cloned, optionally with custom selection. One of the scenarios where you'd want to do it is setting editor's state but not forcing any selection:

// Passing `null` as a selection value to prevent focusing the editor
editor.setEditorState(editorState.clone(null));

Nodes
Base Nodes

Nodes are a core concept in Lexical. Not only do they form the visual editor view, as part of the EditorState, but they also represent the underlying data model for what is stored in the editor at any given time. Lexical has a single core based node, called LexicalNode that is extended internally to create Lexical's five base nodes:

    RootNode
    LineBreakNode
    ElementNode
    TextNode
    DecoratorNode

Of these base nodes, three of them can be extended to create new types of nodes:

    ElementNode
    TextNode
    DecoratorNode

RootNode

There is only ever a single RootNode in an EditorState and it is always at the top and it represents the contenteditable itself. This means that the RootNode does not have a parent or siblings. It can not be subclassed or replaced.

    To get the text content of the entire editor, you should use rootNode.getTextContent().
    To avoid selection issues, Lexical forbids insertion of text nodes directly into a RootNode.

Semantics and Use Cases

Unlike other ElementNode subclasses, the RootNode has specific characteristics and restrictions to maintain editor integrity:

    Non-extensibility
    The RootNode cannot be subclassed or replaced with a custom implementation. It is designed as a fixed part of the editor architecture.

    Exclusion from Mutation Listeners
    The RootNode does not participate in mutation listeners. Instead, use a root-level or update listener to observe changes at the document level.

    Compatibility with Node Transforms
    While the RootNode is not "part of the document" in the traditional sense, it can still appear to be in some cases, such as during serialization or when applying node transforms. A node transform on the RootNode will be called at the end of every node transform cycle. This is useful in cases where you need something like an update listener that occurs before the editor state is reconciled.

    Document-Level Metadata
    If you are attempting to use the RootNode for document-level metadata (e.g., undo/redo support), use the NodeState API.

By design, the RootNode serves as a container for the editor's content rather than an active part of the document's logical structure. This approach simplifies operations like serialization and keeps the focus on content nodes.
LineBreakNode

You should never have '\n' in your text nodes, instead you should use the LineBreakNode which represents '\n', and more importantly, can work consistently between browsers and operating systems.
ElementNode

Used as parent for other nodes, can be block level (ParagraphNode, HeadingNode) or inline (LinkNode). Has various methods which define its behaviour that can be overridden during extension (isInline, canBeEmpty, canInsertTextBefore and more)
TextNode

Leaf type of node that contains text. It also includes few text-specific properties:

    format any combination of bold, italic, underline, strikethrough, code, highlight, subscript and superscript
    mode
        token - acts as immutable node, can't change its content and is deleted all at once
        segmented - its content deleted by segments (one word at a time), it is editable although node becomes non-segmented once its content is updated
    style can be used to apply inline css styles to text

DecoratorNode

Wrapper node to insert arbitrary view (component) inside the editor. Decorator node rendering is framework-agnostic and can output components from React, vanilla js or other frameworks.
Node Properties
tip

If you're using Lexical v0.26.0 or later, you should consider using the NodeState API instead of defining properties directly on your subclasses. NodeState features automatic support for afterCloneFrom, exportJSON, and updateFromJSON requiring much less boilerplate and some additional benefits. You may find that you do not need a subclass at all in some situations, since your NodeState can be applied ad-hoc to any node.

Lexical nodes can have properties. It's important that these properties are JSON serializable too, so you should never be assigning a property to a node that is a function, Symbol, Map, Set, or any other object that has a different prototype than the built-ins. null, undefined, number, string, boolean, {} and [] are all types of property that can be assigned to node.

By convention, we prefix properties with __ (double underscore) so that it makes it clear that these properties are private and their access should be avoided directly. We opted for __ instead of _ because of the fact that some build tooling mangles and minifies single _ prefixed properties to improve code size. However, this breaks down if you're exposing a node to be extended outside of your build.

If you are adding a property that you expect to be modifiable or accessible, then you should always create a set of get*() and set*() methods on your node for this property. Inside these methods, you'll need to invoke some very important methods that ensure consistency with Lexical's internal immutable system. These methods are getWritable() and getLatest().

We recommend that your constructor should always support a zero-argument instantiation in order to better support collab and to reduce the amount of boilerplate required. You can always define your $create* functions with required arguments.

import type {NodeKey} from 'lexical';

class MyCustomNode extends SomeOtherNode {
  __foo: string;

  constructor(foo: string = '', key?: NodeKey) {
    super(key);
    this.__foo = foo;
  }

  setFoo(foo: string): this {
    // getWritable() creates a clone of the node
    // if needed, to ensure we don't try and mutate
    // a stale version of this node.
    const self = this.getWritable();
    self.__foo = foo;
    return self;
  }

  getFoo(): string {
    // getLatest() ensures we are getting the most
    // up-to-date value from the EditorState.
    const self = this.getLatest();
    return self.__foo;
  }
}

Lastly, all nodes should have static getType(), static clone(), and static importJSON() methods. Lexical uses the type to be able to reconstruct a node back with its associated class prototype during deserialization (important for copy + paste!). Lexical uses cloning to ensure consistency between creation of new EditorState snapshots.

Expanding on the example above with these methods:

interface SerializedCustomNode extends SerializedLexicalNode {
  foo?: string;
}

class MyCustomNode extends SomeOtherNode {
  __foo: string;

  static getType(): string {
    return 'custom-node';
  }

  static clone(node: MyCustomNode): MyCustomNode {
    // If any state needs to be set after construction, it should be
    // done by overriding the `afterCloneFrom` instance method.
    return new MyCustomNode(node.__foo, node.__key);
  }

  static importJSON(
    serializedNode: LexicalUpdateJSON<SerializedMyCustomNode>,
  ): MyCustomNode {
    return new MyCustomNode().updateFromJSON(serializedNode);
  }

  constructor(foo: string = '', key?: NodeKey) {
    super(key);
    this.__foo = foo;
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedMyCustomNode>,
  ): this {
    const self = super.updateFromJSON(serializedNode);
    return typeof serializedNode.foo === 'string'
      ? self.setFoo(serializedNode.foo)
      : self;
  }

  exportJSON(): SerializedMyCustomNode {
    const serializedNode: SerializedMyCustomNode = super.exportJSON();
    const foo = this.getFoo();
    if (foo !== '') {
      serializedNode.foo = foo;
    }
    return serializedNode;
  }

  setFoo(foo: string): this {
    // getWritable() creates a clone of the node
    // if needed, to ensure we don't try and mutate
    // a stale version of this node.
    const self = this.getWritable();
    self.__foo = foo;
    return self;
  }

  getFoo(): string {
    // getLatest() ensures we are getting the most
    // up-to-date value from the EditorState.
    const self = this.getLatest();
    return self.__foo;
  }
}

Creating custom nodes

As mentioned above, Lexical exposes three base nodes that can be extended.

    Did you know? Nodes such as ElementNode are already extended in the core by Lexical, such as ParagraphNode and RootNode!

Extending ElementNode

Below is an example of how you might extend ElementNode:

import {ElementNode, LexicalNode} from 'lexical';

export class CustomParagraph extends ElementNode {
  static getType(): string {
    return 'custom-paragraph';
  }

  static clone(node: CustomParagraph): CustomParagraph {
    return new CustomParagraph(node.__key);
  }

  createDOM(): HTMLElement {
    // Define the DOM element here
    const dom = document.createElement('p');
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    // Returning false tells Lexical that this node does not need its
    // DOM element replacing with a new copy from createDOM.
    return false;
  }
}

It's also good etiquette to provide some $ prefixed utility functions for your custom ElementNode so that others can easily consume and validate nodes are that of your custom node. Here's how you might do this for the above example:

export function $createCustomParagraphNode(): CustomParagraph {
  return $applyNodeReplacement(new CustomParagraph());
}

export function $isCustomParagraphNode(
  node: LexicalNode | null | undefined
): node is CustomParagraph  {
  return node instanceof CustomParagraph;
}

Extending TextNode

export class ColoredNode extends TextNode {
  __color: string;

  constructor(text: string, color: string, key?: NodeKey): void {
    super(text, key);
    this.__color = color;
  }

  static getType(): string {
    return 'colored';
  }

  static clone(node: ColoredNode): ColoredNode {
    return new ColoredNode(node.__text, node.__color, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = this.__color;
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__color !== this.__color) {
      dom.style.color = this.__color;
    }
    return isUpdated;
  }
}

export function $createColoredNode(text: string, color: string): ColoredNode {
  return $applyNodeReplacement(new ColoredNode(text, color));
}

export function $isColoredNode(
  node: LexicalNode | null | undefined,
): node is ColoredNode {
  return node instanceof ColoredNode;
}

Extending DecoratorNode

export class VideoNode extends DecoratorNode<ReactNode> {
  __id: string;

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return <VideoPlayer videoID={this.__id} />;
  }
}

export function $createVideoNode(id: string): VideoNode {
  return $applyNodeReplacement(new VideoNode(id));
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}

Using useDecorators, PlainTextPlugin and RichTextPlugin executes React.createPortal(reactDecorator, element) for each DecoratorNode, where the reactDecorator is what is returned by DecoratorNode.prototype.decorate, and the element is an HTMLElement returned by DecoratorNode.prototype.createDOM.
The rest of the boilerplate

When using this method of extension, it is also required to implement the following methods:

    static clone (always - this is already in the above examples)
    static importFromJSON (always)
    updateFromJSON (if any custom properties are defined)
    afterCloneFrom (if any custom properties are defined that are not carried over from static clone)
    exportJSON (if any custom properties are defined)

Creating custom nodes with $config and NodeState

In Lexical v0.33.0, a new method for defining custom nodes was added to reduce boilerplate and add features used by the NodeState API.

The following section shows how the previous examples would be refactored to use the latest functionality, reducing boilerplate.

Note that since these example use NodeState and $config, they will automatically get full and correct implementations of the following methods:

    static clone
    static importFromJSON
    updateFromJSON
    afterCloneFrom
    exportJSON

Best Practices

    The constructor of any custom node must have zero required arguments. This is required for @lexical/yjs support, $create support, and allows the boilerplate static clone and importJSON methods to be eliminated.
        ✅ constructor(text: string = '', key?: NodeKey)
        ❌ constructor(text: string, key?: NodeKey)

    Using only NodeState (and not direct property access) for storing additional data on the node allows the boilerplate afterCloneFrom, exportJSON, and updateFromJSON methods to be eliminated.

Extending ElementNode with $config

Below is an example of how you might extend ElementNode:

    Using $config
    Legacy static methods

import {
  $create,
  type EditorConfig,
  ElementNode,
  type LexicalNode,
} from 'lexical';

export class CustomParagraph extends ElementNode {
  $config() {
    return this.config('custom-paragraph', {extends: ElementNode});
  }

  createDOM(): HTMLElement {
    // Define the DOM element here
    const dom = document.createElement('p');
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    // Returning false tells Lexical that this node does not need its
    // DOM element replaced with a new one from createDOM.
    return false;
  }
}

It's also good etiquette to provide some $ prefixed utility functions for your custom ElementNode so that others can easily consume and validate nodes are that of your custom node. Here's how you might do this for the above example:

export function $createCustomParagraphNode(): CustomParagraph {
  return $create(CustomParagraph);
}

export function $isCustomParagraphNode(
  node: LexicalNode | null | undefined
): node is CustomParagraph  {
  return node instanceof CustomParagraph;
}

Extending TextNode with $config

    Using $config
    Legacy static methods and properties

import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  type EditorConfig,
  type LexicalNode,
  TextNode,
  createState,
} from 'lexical';

const DEFAULT_COLOR = 'inherit';

// This defines how the color property is parsed along with a default value
const colorState = createState('color', {
  parse: (value) => (typeof value === 'string' ? value : DEFAULT_COLOR),
});

export class ColoredNode extends TextNode {
  $config() {
    return this.config('colored', {
      extends: TextNode,
      // This defines the serialization of the color NodeState as
      // a flat property of the SerializedLexicalNode JSON instead of
      // nesting it in the '$' property
      stateConfigs: [{flat: true, stateConfig: colorState}],
    });
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = $getState(this, colorState);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (super.updateDOM(prevNode, dom, config)) {
      return true;
    }
    const colorChange = $getStateChange(this, prevNode, colorState);
    if (colorChange !== null) {
      dom.style.color = colorChange[0];
    }
    return false;
  }
}

export function $createColoredNode(text: string, color: string): ColoredNode {
  // Since our constructor has 0 arguments, we set all of its properties
  // after construction.
  return $setState($create(ColoredNode).setText(text), colorState, color);
}

export function $isColoredNode(
  node: LexicalNode | null | undefined,
): node is ColoredNode {
  return node instanceof ColoredNode;
}

Extending DecoratorNode using $config

    Using $config
    Legacy static methods and properties

import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  createState,
} from 'lexical';

const idState = createState('id', {
  parse: (value) => (typeof value === 'string' ? value : ''),
});

export class VideoNode extends DecoratorNode<ReactNode> {
  $config() {
    return this.config('video', {
      extends: DecoratorNode,
      stateConfigs: [{flat: true, stateConfig: idState}],
    });
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return <VideoPlayer videoID={$getState(this, idState)} />;
  }
}

export function $createVideoNode(id: string): VideoNode {
  return $setState($create(VideoNode), idState, id);
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}

Using useDecorators, PlainTextPlugin and RichTextPlugin executes React.createPortal(reactDecorator, element) for each DecoratorNode, where the reactDecorator is what is returned by DecoratorNode.prototype.decorate, and the element is an HTMLElement returned by DecoratorNode.prototype.createDOM.

Node Replacement

Node Replacement allow you to replace all instances of a given node in your editor with instances of a subclass.
Use Case
note

In earlier versions of this documentation, "Node Replacement" was called "Node Overrides". We've changed the name to match the terms used in the implementation.
tip

If your use case only requires adding ad-hoc data to existing nodes, you may be able to use the NodeState API instead of subclassing and node replacement.

Some of the most commonly used Lexical Nodes are owned and maintained by the core library. For example, ParagraphNode, HeadingNode, QuoteNode, List(Item)Node etc - these are all provided by Lexical packages, which provides an easier out-of-the-box experience for some editor features, but makes it difficult to override their behavior. For instance, if you wanted to change the behavior of ListNode, you would typically extend the class and override the methods. However, how would you tell Lexical to use your ListNode subclass in the ListPlugin instead of using the core ListNode? That's where Node Replacement can help.

Node Replacement allow you to replace all instances of a given node in your editor with instances of a different node class. This can be done through the nodes array in the Editor config:

const editorConfig = {
    ...
    nodes=[
        // Don't forget to register your custom node separately!
        CustomParagraphNode,
        {
            replace: ParagraphNode,
            with: (node: ParagraphNode) => {
                return $createCustomParagraphNode();
            },
            withKlass: CustomParagraphNode,
        }
    ]
}

In the snippet above,

    replace: Specifies the core node type to be replaced.
    with: Defines a transformation function to replace instances of the original node to the custom node.
    withKlass: This option ensures that behaviors associated with the original node type work seamlessly with the replacement. For instance, node transforms or mutation listeners targeting ParagraphNode will also apply to CustomParagraphNode when withKlass is specified. Without this option, the custom node might not fully integrate with the editor's built-in features, leading to unexpected behavior.

Once this is done, Lexical will replace all ParagraphNode instances with CustomParagraphNode instances. One important use case for this feature is overriding the serialization behavior of core nodes. Check out the full example below.
Node Replacement Example
This example demonstrates using Node Replacement to replace all ParagraphNode with a CustomParagraphNode that overrides createDOM.

NodeState

The NodeState API introduced in v0.26.0 allows arbitrary state to be added ad-hoc to any node in a way that participates with reconciliation, history, and JSON serialization.
Use Case

NodeState allows your application to define keys that can be stored on any node with automatic JSON support, you can even add state to the root node to store document-level metadata.
tip

You can even add node state to the RootNode to store document-level metadata, which wasn't possible at all before!

With a combination of NodeState and other APIs such as Listeners or Transforms you can likely shape the editor to meet your needs without having to do much Node Customization.

Even when you are subclassing nodes, using NodeState instead of additional properties to store the node's data can be more efficient and will save you from writing a lot of boilerplate in the constructor, updateFromJSON, and exportJSON.
Stability

🧪 This API is experimental, and may evolve without a long deprecation period. See also Capabilities for notes on what it can and can not do out of the box today.
Usage
createState

createState creates a StateConfig which defines the key and configuration for your NodeState value.

The key must be locally unique, two distinct StateConfig must not have the same string key if they are to be used on the same node.

Typical usage will look something like this:

const questionState = createState('question', {
  parse: (v) => (typeof v === 'string' ? v : ''),
});

The required parse function serves two purposes:

    It provides a type-safe and runtime-safe way to parse values that were serialized to JSON
    When called with undefined (or any invalid value) it should return some default value (which may be undefined or null or any other value you choose)

In this case, the question must be a string, and the default is an empty string.

See the createState API documentation for more details, there are other optional settings that you may want to define particularly if the value is not a primitive value such as boolean, string, number, null, or undefined.
tip

We recommend building a library of small reusable parse functions for the data types that you use, or a library that can be used to generate them such as zod, ArkType, Effect, Valibot, etc. especially when working with non-primitive data types.
$getState

$getState gets the NodeState value from the given node, or the default if that key was never set on the node.

const question = $getState(pollNode, questionState);

See also $getStateChange if you need an efficient way to determine if the state has changed on two versions of the same node (typically used in updateDOM, but may be useful in an update listener or mutation listener).
$setState

$setState sets the NodeState value on the given node.

const question = $setState(
  pollNode,
  questionState,
  'Are you planning to use NodeState?',
);

tip

The last argument is a ValueOrUpdater, just like with React's useState setters. If you use an updater function and the value does not change, the node and its NodeState won't be marked dirty.
Serialization

The NodeState for a node, if any values are set to non-default values, is serialized to a record under a single NODE_STATE_KEY which is equal to '$'. In the future, it is expected that nodes will be able to declare required state and lift those values to the top-level of their serialized nodes (see #7260).

{
  "type": "poll",
  "$": {
    "question": "Are you planning to use NodeState?",
  }
}

tip

By default, it is assumed that your parsed values are JSON serializable, but for advanced use cases you may use values such as Date, Map, or Set that need to be transformed before JSON serialization. See the StateValueConfig API documentation.
Efficiency

NodeState uses a copy-on-write scheme to manage each node's state. If none of the state has changed, then the NodeState instance will be shared across multiple versions of that node.
info

In a given reconciliation cycle, the first time a Lexical node is marked dirty via getWritable will create a new instance of that node. All properties of the previous version are set on the new instance. NodeState is stored as a single property, and no copying of the internal state is done until the NodeState itself is marked writable.

When serializing to JSON, each key will only be stored if the value is not equal to the default value. This can save quite a lot of space and bandwidth.

Parsing and serialization is only done at network boundaries, when integrating with JSON or Yjs. When a value changes from an external source, it is only parsed once the first time it is read. Values that do not come from external sources are not parsed, and values that are not used are never parsed.
Capabilities

Current:

    Allows you to define and add state to any node
    Serializes that state automatically in the node's JSON, supporting versioning and copy+paste
    Works with the reconciler, TextNodes with differing state will not be implicitly merged
    @lexical/yjs support, NodeState will be automatically synchronized like any other property
    NodeState values that are not used will simply pass-through, making it a bit easier for situations where multiple configurations are used on the same data (e.g. older and newer versions of your editor, a different set of plugins based on context, etc.).
    Pre-registration system for nodes to declare expected state and serialize them as top-level properties (flat) with $config (see #7260).

Future:

    Does not yet integrate directly with importDOM, createDOM or exportDOM (see #7259)
    Does not yet support direct integration with Yjs, e.g. you can not store a Y.Map as a NodeState value (see #7293)
    There isn't yet an easy way to listen for updates to NodeState without registering listeners for every class (see #7321)
    Similarly, there isn't the equivalent of a node transform for NodeState. Transforms must be registered on individual node classes.

Node State Style Example
This example demonstrates an advanced use case of storing a style object on TextNode using NodeState.

Key Management

Keys are a fundamental concept in Lexical that enable efficient state management and node tracking. Understanding how keys work is crucial for building reliable editor implementations.
What are Keys?

The __key property is a unique identifier assigned to each node in the Lexical editor. These keys are:

    Automatically generated by Lexical
    Used to track nodes in the editor state
    Essential for state management and updates
    Immutable during a node's lifecycle

When to Use __key?
✅ Correct Usage

Keys should ONLY be used in two specific situations:

    In Node Constructors

class MyCustomNode extends ElementNode {
  constructor(someData: string, key?: NodeKey) {
    super(key); // Correctly passing key to parent constructor
    this.__someData = someData;
  }
}

    In Static Clone Methods

class MyCustomNode extends ElementNode {
  static clone(node: MyCustomNode): MyCustomNode {
    return new MyCustomNode(node.__someData, node.__key);
  }
}

❌ Incorrect Usage

Never use keys in these situations:

// ❌ Don't pass keys between different nodes
const newNode = new MyCustomNode(existingNode.__key);

// ❌ Don't manipulate keys directly
node.__key = 'custom-key';

How Lexical Uses Keys
Diagram

The dotted outlines show nodes that are re-used in a zero-copy fashion from one EditorState to the next

Update Node A

Key A

Key B

Key C

A (v1)

NodeMap (v1)

B (v0)

C (v0)

Create Node C

Key A

Key B

Key C

A (v0)

NodeMap (v1)

B (v0)

C (v0)

Initial State

Key A

Key B

NodeMap (v0)

A (v0)

B (v0)
Node Map Structure

The EditorState maintains a Map<NodeKey, LexicalNode> that tracks all nodes. Nodes refer to each other using keys in their internal pointers:

// Internal node structure (not for direct usage)
{
  __prev: null | NodeKey,
  __next: null | NodeKey,
  __parent: null | NodeKey,
  // __first, __last and __size are only for ElementNode to track its children
  __first: null | NodeKey,
  __last: null | NodeKey,
  __size: number
}

These internal pointers maintain the tree structure and should never be manipulated directly.
Key-Related APIs

    Editor Methods

    // Get node by key
    const node = editor.getElementByKey(key);
    const node = $getNodeByKey(key);

    // Get latest version of a node
    const latest = node.getLatest();

    // Get mutable version for updates
    const mutable = node.getWritable();

Key Lifecycle

NodeKeys are ephemeral and have several important characteristics:

    Serialization
        Keys are never serialized
        New keys are generated when deserializing (from JSON/HTML)
        Keys are only meaningful within their EditorState instance

    Uniqueness
        Keys are unique within an EditorState
        Current implementation uses serial numbers for debugging
        Should be treated as random and opaque values
        Never logically reused

Keys are used internally by Lexical to:

    Track nodes in the editor state
    Manage node updates and versions
    Maintain referential integrity
    Enable efficient state updates

Common Pitfalls

Key Reuse

// ❌ Never do this
function duplicateNode(node: LexicalNode) {
  return new SameNodeType(data, node.__key);
}

Manual Key Assignment

// ❌ Never do this
node.__key = generateCustomKey();

Incorrect Constructor/Clone Implementation

// ❌ Never do this - missing key in constructor
class MyCustomNode extends ElementNode {
  constructor(someData: string) {
    super(); // Missing key parameter
    this.__someData = someData;
  }
}

// ✅ Correct implementation
class MyCustomNode extends ElementNode {
  __someData: string;

  constructor(someData: string, key?: NodeKey) {
    super(key);
    this.__someData = someData;
  }
  
  static clone(node: MyCustomNode): MyCustomNode {
    return new MyCustomNode(node.__someData, node.__key);
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__someData = prevNode.__someData;
  }
}

Node Replacement

// ❌ Never re-use the key when changing the node class
const editorConfig = {
  nodes: [
    CustomNodeType,
    {
      replace: OriginalNodeType,
      with: (node: OriginalNodeType) => new CustomNodeType(node.__key),
      withKlass: CustomNodeType
    }
  ]
};

// ✅ Correct: Use node replacement configuration
const editorConfig = {
  nodes: [
    CustomNodeType,
    {
      replace: OriginalNodeType,
      with: (node: OriginalNodeType) => new CustomNodeType(),
      withKlass: CustomNodeType
    }
  ]
};

    For proper node replacement, see the Node Replacement guide.

Best Practices

    Let Lexical Handle Keys

    import {$applyNodeReplacement} from 'lexical';

    // Create node helper function
    export function $createMyCustomNode(data: string): MyCustomNode {
      return $applyNodeReplacement(new MyCustomNode(data));
    }

Testing Considerations

When writing tests involving node keys:

test('node creation', async () => {
  await editor.update(() => {
    // ✅ Correct: Create nodes normally
    const node = new MyCustomNode("test");
    
    // ✅ Correct: Keys are automatically handled
    expect(node.__key).toBeDefined();
    expect(node.__key).not.toBe('');
  });
});

Performance Impact

Understanding key management is crucial for performance:

    Keys enable efficient node lookup (O(1))
    Proper key usage prevents unnecessary re-renders
    Lexical's key system optimizes state updates
    Improper key manipulation can cause performance issues

Common Questions

Q: How do I reference a node later? A: Store a reference to the node. Conventionally, all node methods will use getLatest() or getWritable() which will look up the latest version of that node before reading or writing its properties, which is equivalent to using the key but is type-safe (but may cause errors if you try to use a reference to a node that no longer exists). In some situations it may be preferable to use the key directly, which is also fine.

Q: How do I ensure unique nodes? A: Let Lexical handle key generation and management. Focus on node content and structure.