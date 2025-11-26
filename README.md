# react-codemirror-yara-highlight
@uiw/react-codemirror extension to support highlighting for the YARA language

<img width="544" height="525" alt="image" src="https://github.com/user-attachments/assets/c404f86c-0d43-4cd0-8578-5dd7f8d526bb" />


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

## Contributing
You're welcome to create any PR's to improve any part of this repo, even this README.md
