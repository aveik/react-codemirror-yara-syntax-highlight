import { Extension, RangeSetBuilder } from '@codemirror/state'
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import './yaraHighlightStyles.css'

/**
 * Main highlighting function that processes the entire document text
 * and returns a DecorationSet containing all syntax highlighting decorations.
 *
 * @param view - The CodeMirror EditorView instance
 * @returns A DecorationSet containing all the highlighting decorations
 */
function highlightYara(view: EditorView): DecorationSet {
    // RangeSetBuilder is used to efficiently build a sorted set of decorations
    // It ensures decorations are added in the correct order (by position)
    const builder = new RangeSetBuilder<Decoration>()

    // Get the entire document text as a string for pattern matching
    const text = view.state.doc.toString()

    /**
     * Decoration Definitions
     *
     * Each decoration type corresponds to a different syntax element.
     * The 'class' property will be applied as a CSS class to the matched text.
     */
    const keywordDecoration = Decoration.mark({ class: 'cm-keyword' }) // YARA keywords (blue, bold)
    const stringDecoration = Decoration.mark({ class: 'cm-string' }) // String literals (green)
    const commentDecoration = Decoration.mark({ class: 'cm-comment' }) // Comments (gray, italic)
    const numberDecoration = Decoration.mark({ class: 'cm-number' }) // Numbers and hex (red)
    const metaDecoration = Decoration.mark({ class: 'cm-meta' }) // Meta directives (purple)
    const variableDecoration = Decoration.mark({ class: 'cm-variableName' }) // YARA string variables like $var
    const ruleNameDecoration = Decoration.mark({ class: 'cm-def' }) // Rule names
    const operatorDecoration = Decoration.mark({ class: 'cm-operator' }) // Operators
    const atomDecoration = Decoration.mark({ class: 'cm-atom' }) // Boolean literals

    /**
     * Matches Array
     *
     * This array will store all found matches with their positions and priority.
     * Priority is used to resolve conflicts when ranges overlap.
     * Lower priority numbers = higher priority (processed first).
     */
    const matches: Array<{
        start: number // Starting position in the document
        end: number // Ending position in the document
        decoration: Decoration // The decoration to apply
        priority: number // Priority for conflict resolution
    }> = []

    // Variable to store regex match results
    let match

    /**
     * Multi-line Comments Detection (Priority 1 - Highest)
     *
     * These have the highest priority because they can span multiple lines
     * and can contain other tokens that should not be highlighted separately.
     */
    const multiCommentRegex = /\/\*[\s\S]*?\*\//g
    while ((match = multiCommentRegex.exec(text)) !== null) {
        matches.push({
            start: match.index, // Start position of the match
            end: match.index + match[0].length, // End position (start + length)
            decoration: commentDecoration, // Apply comment styling
            priority: 1 // Highest priority
        })
    }

    /**
     * Single-line Comments Detection (Priority 1 - Highest)
     *
     * Pattern: // ... (to end of line)
     * Also high priority to prevent highlighting tokens within comments.
     * The 'm' flag enables multiline mode so ^ and $ match line boundaries.
     */
    const singleCommentRegex = /\/\/.*$/gm
    while ((match = singleCommentRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: commentDecoration,
            priority: 1
        })
    }

    /**
     * String Literals Detection (Priority 2)
     *
     * Pattern: "..." with support for escaped characters
     * Handles both regular strings and strings that may not be properly closed
     * String literals should not have their contents highlighted as keywords,
     * so they get higher priority than keywords but lower than comments.
     */
    const stringRegex = /"(?:[^\\"]|\\.)*?(?:"|$)/g
    while ((match = stringRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: stringDecoration,
            priority: 2
        })
    }

    /**
     * Rule Declaration Detection (Priority 3)
     *
     * Pattern: rule <rule_name> {
     * This captures the rule keyword, the rule name, and highlights them differently.
     * Rule names are important identifiers in YARA and should be highlighted distinctly.
     */
    const ruleDeclarationRegex = /\b(rule)(\s+)([a-zA-Z_]\w{0,127})\s*\{/g
    while ((match = ruleDeclarationRegex.exec(text)) !== null) {
        // Highlight the "rule" keyword
        matches.push({
            start: match.index,
            end: match.index + match[1].length,
            decoration: keywordDecoration,
            priority: 3
        })

        // Highlight the rule name (skip whitespace)
        const ruleNameStart = match.index + match[1].length + match[2].length
        matches.push({
            start: ruleNameStart,
            end: ruleNameStart + match[3].length,
            decoration: ruleNameDecoration,
            priority: 3
        })
    }

    /**
     * YARA String Variables Detection (Priority 3)
     *
     * Pattern: $variable_name
     * YARA uses $ prefix for string variables like $string1, $hex_pattern, etc.
     * These are references to strings defined in the strings section.
     */
    const variableRegex = /\$\w*/g
    while ((match = variableRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: variableDecoration,
            priority: 3
        })
    }

    /**
     * Meta Directives Detection (Priority 4)
     *
     * Pattern: Lines starting with # (like #include)
     * These are preprocessor-like directives in YARA.
     * The 'm' flag enables multiline mode for proper ^ matching.
     */
    const metaRegex = /^#.*$/gm
    while ((match = metaRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: metaDecoration,
            priority: 4
        })
    }

    /**
     * Number and Hex Patterns Detection (Priority 5)
     *
     * Patterns supported:
     * - Hexadecimal numbers: 0x1A2B, 0xFF, 0x0
     * - Decimal numbers: 123, 0, 999, 3.14
     * - Hex byte patterns: AF 12 3C (used in YARA hex strings)
     */

    // Hex numbers (0x prefix)
    const hexNumberRegex = /\b0x[a-fA-F\d]+\b/g
    while ((match = hexNumberRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: numberDecoration,
            priority: 5
        })
    }

    // Decimal numbers (including floats)
    const decimalRegex = /\b(?:\.\d+|\d+\.?\d*)\b/g
    while ((match = decimalRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: numberDecoration,
            priority: 5
        })
    }

    // Hex byte patterns (sequences of hex bytes, used in YARA hex strings)
    // Matches patterns like: AF 12 3C or AF123C (but not if part of a larger word)
    const hexPatternRegex = /(?<![.\w])([a-fA-F\d?]{2})+(?![.\w])/g
    while ((match = hexPatternRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: numberDecoration,
            priority: 5
        })
    }

    /**
     * Boolean Atoms Detection (Priority 6)
     *
     * Pattern: true, false
     * These are boolean literals in YARA and should be highlighted distinctly from keywords.
     */
    const atomRegex = /\b(true|false)\b/g
    while ((match = atomRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: atomDecoration,
            priority: 6
        })
    }

    /**
     * Operators Detection (Priority 7)
     *
     * Pattern: Various YARA operators
     * Includes arithmetic, comparison, and logical operators used in YARA conditions.
     */
    const operatorRegex = /[-+\/*=<>:]+/g
    while ((match = operatorRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: operatorDecoration,
            priority: 7
        })
    }

    /**
     * Keywords Detection (Priority 8 - Lowest)
     *
     * Comprehensive list of YARA keywords including:
     * - Control flow: all, and, any, for, not, or, of
     * - String modifiers: ascii, wide, nocase, fullword, base64, base64wide
     * - Functions: contains, endswith, startswith, matches, icontains, etc.
     * - Data types: int8, int16, int32, uint8, uint16, uint32 (including big-endian variants)
     * - Special keywords: condition, strings, meta, rule, import, include, etc.
     *
     * Keywords have the lowest priority because they should be overridden
     * by strings, comments, variables, etc. when there are conflicts.
     */
    const keywordRegex =
        /\b(all|and|any|ascii|at|base64|base64wide|condition|contains|endswith|entrypoint|filesize|for|fullword|global|icontains|iendswith|import|in|include|int8|int16|int32|int8be|int16be|int32be|istartswith|matches|meta|nocase|not|of|or|private|rule|startswith|strings|them|uint8|uint16|uint32|uint8be|uint16be|uint32be|wide|xor)\b/g
    while ((match = keywordRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            decoration: keywordDecoration,
            priority: 8
        })
    }

    /**
     * Sorting Matches
     *
     * CodeMirror requires decorations to be added in order by position.
     * First sort by start position, then by priority (lower number = higher priority).
     * This ensures that when we process overlapping ranges, higher priority
     * items are processed first.
     */
    matches.sort((a, b) => {
        if (a.start !== b.start) {
            return a.start - b.start // Primary sort: by position
        }
        return a.priority - b.priority // Secondary sort: by priority
    })

    /**
     * Overlap Resolution
     *
     * Since multiple patterns might match overlapping text ranges,
     * we need to filter out conflicts. We keep the first match for
     * any overlapping region (which will be the highest priority
     * due to our sorting).
     */
    const filteredMatches: Array<{ start: number; end: number; decoration: Decoration }> = []

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i]
        let shouldAdd = true

        // Check if this range overlaps with any already added range
        for (const added of filteredMatches) {
            // Two ranges overlap if: current.start < added.end AND current.end > added.start
            if (current.start < added.end && current.end > added.start) {
                // Overlapping ranges detected - skip this one (lower priority)
                shouldAdd = false
                break
            }
        }

        // Only add non-overlapping ranges or higher priority ranges
        if (shouldAdd) {
            filteredMatches.push({
                start: current.start,
                end: current.end,
                decoration: current.decoration
            })
        }
    }

    /**
     * Building the Final DecorationSet
     *
     * Add all filtered decorations to the RangeSetBuilder.
     * The builder ensures they're stored in the efficient format
     * that CodeMirror expects for fast rendering.
     */
    for (const match of filteredMatches) {
        builder.add(match.start, match.end, match.decoration)
    }

    // Return the completed decoration set
    return builder.finish()
}

/**
 * YARA Syntax Highlighter ViewPlugin
 *
 * ViewPlugin is CodeMirror's mechanism for adding functionality that
 * needs to interact with the editor view and respond to changes.
 *
 * This plugin:
 * 1. Maintains a set of decorations for syntax highlighting
 * 2. Updates the decorations when the document changes
 * 3. Provides the decorations to the editor for rendering
 */
const yaraHighlighter = ViewPlugin.fromClass(
    class {
        // Store the current set of decorations
        decorations: DecorationSet

        /**
         * Constructor called when the plugin is first created
         *
         * @param view - The EditorView this plugin is attached to
         */
        constructor(view: EditorView) {
            // Generate initial decorations for the current document
            this.decorations = highlightYara(view)
        }

        /**
         * Update method called whenever the editor state changes
         *
         * @param update - Contains information about what changed
         */
        update(update: ViewUpdate) {
            // Only regenerate decorations if the document content changed
            // or if the visible viewport changed (for performance)
            if (update.docChanged || update.viewportChanged) {
                // Regenerate all decorations for the new document state
                this.decorations = highlightYara(update.view)
            }
        }
    },
    {
        /**
         * Plugin Configuration
         *
         * This tells CodeMirror that this plugin provides decorations
         * and how to access them. The function receives the plugin instance
         * and returns the decorations to be applied to the editor.
         */
        decorations: (v) => v.decorations
    }
)

/**
 * YARA Language Extension Factory Function
 *
 * This is the main export that creates the YARA language extension.
 * It returns an Extension that can be passed to CodeMirror's extensions array.
 *
 * @returns An Extension containing the YARA syntax highlighter
 */
export const yaraLanguage = (): Extension => [yaraHighlighter]
