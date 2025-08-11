# Some extra context on the UI 

This was discussed by myself and Opus when the issues were created but I don't think the nuance got captured in terms of how the settings menu is pictured. 

The idea is both a right click on the selected model or hitting the [+] button both render the same UI where you are able to define the active provider, model, prompt and model settings. 

┌───────────────────────────────────────────┐
│ ← Back │ ⚙️ Settings: Claude-Opus         │
├───────────────────────────────────────────┤
│                                           │
│  Display Name     [ Claude-Opus       ]   │
│  Terminal Color   [ 🎨 #D97706        ]   │
│  Provider         [ OpenRouter...     ]   │
│  Model ID         [ A Logo claude-3... ▼] │
│                                           │
│ 🌡️ Temperature   (────────────────●──)    │
│                                           │
│ 🧠 System Prompt                          │
│  ┌─────────────────────────────────────┐  │
│  │ You are an expert AI architect...   │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘

We will eventually make the model settings more complete (eg, top p, max thinking etc). Probably it will be like the 3 basic setting and then a "more settings" toggle. 

# Round 2 Follow Ups 

```
 - Revert ModelPills.tsx to show all models
  in one unified view (not split
  active/inactive)
  - Restore original discovery behavior that
  was working before
```

Ah i see the nuance missing i'll explain the flow. 

When you open the sidebar it default to the following; 

(default-model) (+) 

The default model is a setting dialogue we will be creating at a later step we can just default to alphabetical order in the event `default mode = null`. 

This makes it so if the user wants to change models in a single threaded conversation they have the option of just picking the current pill, setting the new model, and carrying on. 

but they could also hit (+), select a new model in the same settings menu, and then they are talking to both models. 

At this point you can take advantage of toggling models on and off to show/hide their message history etc. We cap the user at 3 active models. We may need to have it be like 

(gemma3:27b | x) 

Where you can hit a button to remove a model. we'd want to use something similar to the current inline delete confirmation. 

this is an older document but you can look over @mockup.html for some context. you'll see the option we are picking is kind of a hybrid merger of those two. We are using the 'Option A: Sequential Responses (Simple)' 

```
 - Color picker: "3 colors then +" approach
  instead of 6 fixed colors
```

For clarity on the intent here we wanted to make a couple changes to this and the emoji ui that were interconnected. basically we are solving for a few issues: 

1. The last of the color options opens a full color picker UI. This behavior is excellent but non-obvious in the current ui
2. The current emoji UI requires the user to find and copy in an emoji. Ideally we leave that as a possible override but give on click a similar picker to the colors. 
3. The current dialogue is spawned in the center of the browser UI for the color picker, ideally we want to center this over the sidebar. 

```
+ button: Make smaller/more subtle
```

regarding this one we don't need to scale it down but i just mean for the top model picker we can try removing the word add so it's not 

( default-model | x ) (+ Add) 

it's just 

( default-model | x ) (+) 

feel free to ask follow up questions as needed. 

