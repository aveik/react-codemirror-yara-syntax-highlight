# react-codemirror-yara-syntax-highlight
`@uiw/react-codemirror` extension to support YARA language syntax highlighting

CSS styling is based on the popular [Solarized](https://ethanschoonover.com/solarized/) theme

This is just an implementation for a use-case in my company. Extension is likely usable with the basic [`codemirror`](https://www.npmjs.com/package/codemirror) package ([guide](https://codemirror.net/docs/guide/)), I just haven't tried it out yet

<img width="524" height="494" alt="image" src="https://github.com/user-attachments/assets/ad1e84f1-5b9e-4383-9ca9-1841c72f2505" />

## Requirements
[`@uiw/codemirror`](https://www.npmjs.com/package/@uiw/react-codemirror)

[`@codemirror/view`](https://www.npmjs.com/package/@codemirror/view)

[`@codemirror/state`](https://www.npmjs.com/package/@codemirror/state)

## Usage
- Copy the [`yaraLanguage.ts`](https://github.com/aveik/react-codemirror-yara-syntax-highlight/blob/main/yaraLanguage.ts) file into your project
- Import the `yaraLanguage` object inside your React component and pass it into the `extensions` array prop:
```ts
import { yaraLanguage ) from './yaraLanguage'

<CodeMirror
    ...props
    extensions={[yaraLanguage()]}
/>
```

## Tested with
`@codemirror/view@6.38.4` & `@codemirror/state@6.5.2` & `react@18.3.1`

### YARA-X has not been tested yet!

## Notes
Works well with [Dark Reader](https://darkreader.org/)

<img width="524" height="494" alt="image" src="https://github.com/user-attachments/assets/9383acb6-ef9a-42fe-ad3b-30348c9d099c" />


## Contributing
Anyone is welcome to create any PR's to improve any part of this repo, even this README.md
