# react-codemirror-yara-syntax-highlight
`@uiw/react-codemirror` extension to support YARA language syntax highlighting

CSS styling is based on the [Solarized](https://ethanschoonover.com/solarized/) theme

<img width="524" height="494" alt="image" src="https://github.com/user-attachments/assets/ad1e84f1-5b9e-4383-9ca9-1841c72f2505" />


## Requirements
`@codemirror/view` and `@codemirror/state`

## Usage
Import the `yaraLanguage` object inside your React component and pass it into the `extensions` array prop
```ts
import { yaraLanguage ) from './yaraLanguage'

<CodeMirror
    ...props
    extensions={[yaraLanguage()]}
/>
```

## Tested with
`@codemirror/view@6.38.4` & `@codemirror/state@6.5.2` & `react@18.3.1`

## Notes
Works well with [Dark Reader](https://darkreader.org/)

<img width="524" height="494" alt="image" src="https://github.com/user-attachments/assets/9383acb6-ef9a-42fe-ad3b-30348c9d099c" />


## Contributing
Anyone is welcome to create any PR's to improve any part of this repo, even this README.md
