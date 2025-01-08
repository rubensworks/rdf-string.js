import { DataFactory } from "rdf-data-factory";
import * as RDF from "@rdfjs/types";

const FACTORY = new DataFactory();

/**
 * Utility methods for converting between string-based RDF representations and RDFJS objects.
 *
 * RDF Terms are represented as follows:
 * * Blank nodes: '_:myBlankNode'
 * * Variables:   '?myVariable'
 * * Literals:    '"myString"', '"myLanguageString"@en-us', '"myLanguageString"@en-us--ltr', '"3"^^xsd:number'
 * * URIs:        'http://example.org'
 *
 * Quads/triples are represented as hashes with 'subject', 'predicate', 'object' and 'graph' (optional)
 * as keys, and string-based RDF terms as values.
 */

/**
 * Convert an RDFJS term to a string-based representation.
 * @param {RDF.Term} term An RDFJS term.
 * @return {string} A string-based term representation.
 */
export function termToString<T extends RDF.Term | undefined | null>(term: T): T extends RDF.Term ? string : undefined {
  // TODO: remove nasty any casts when this TS bug has been fixed: https://github.com/microsoft/TypeScript/issues/26933
  if (!term) {
    return <any> undefined;
  }
  switch (term.termType) {
  case 'NamedNode': return <any> term.value;
  case 'BlankNode': return <any> ('_:' + term.value);
  case 'Literal':
    const literalValue: RDF.Literal = <RDF.Literal> term;
    return <any> ('"' + literalValue.value + '"' +
      (literalValue.datatype &&
      literalValue.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string' &&
      literalValue.datatype.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' &&
      literalValue.datatype.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString'?
        '^^' + literalValue.datatype.value : '') +
      (literalValue.language ? '@' + literalValue.language : '') +
      (literalValue.direction ? '--' + literalValue.direction : ''));
  case 'Quad': return <any> `<<${termToString(term.subject)} ${termToString(term.predicate)} ${termToString(term.object)}${term.graph.termType === 'DefaultGraph' ? '' : ' ' + termToString(term.graph)}>>`;
  case 'Variable': return <any> ('?' + term.value);
  case 'DefaultGraph': return <any> term.value;
  }
}

/**
 * Get the string value of a literal.
 * @param {string} literalValue An RDF literal enclosed by '"'.
 * @return {string} The literal value inside the '"'.
 */
export function getLiteralValue(literalValue: string): string {
  const match = /^"([^]*)"/.exec(literalValue);
  if (!match) {
    throw new Error(literalValue + ' is not a literal');
  }
  return match[1];
}

/**
 * Get the datatype of the given literal.
 * @param {string} literalValue An RDF literal.
 * @return {string} The datatype of the literal.
 */
export function getLiteralType(literalValue: string): string {
  const match = /^"[^]*"(?:\^\^([^"]+)|(@)[^@"]+)?$/.exec(literalValue);
  if (!match) {
    throw new Error(literalValue + ' is not a literal');
  }
  return match[1] || (match[2]
    ? 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' : 'http://www.w3.org/2001/XMLSchema#string');
}

/**
 * Get the language of the given literal.
 * @param {string} literalValue An RDF literal.
 * @return {string} The language of the literal.
 */
export function getLiteralLanguage(literalValue: string): string {
  const match = /^"[^]*"(?:@([^@"]+)|\^\^[^"]+)?$/.exec(literalValue);
  if (!match) {
    throw new Error(literalValue + ' is not a literal');
  }
  if (match[1]) {
    let ret = match[1].toLowerCase();

    // Remove everything after --, since this indicates the base direction, which will be parsed later.
    const doubleDashPos = ret.indexOf('--');
    if (doubleDashPos >= 0) {
      ret = ret.slice(0, doubleDashPos);
    }

    return ret;
  }
  return '';
}

/**
 * Get the direction of the given literal.
 * @param {string} literalValue An RDF literal.
 * @return {string} The direction of the literal.
 */
export function getLiteralDirection(literalValue: string): 'ltr' | 'rtl' | '' {
  const doubleDashPos = literalValue.indexOf('--', literalValue.lastIndexOf('"'));
  if (doubleDashPos >= 0) {
    const direction = literalValue.slice(doubleDashPos + 2, literalValue.length);
    if (direction === 'ltr' || direction === 'rtl') {
      return direction;
    }
    throw new Error(literalValue + ' is not a literal with a valid direction');
  }
  return '';
}

/**
 * Transform a string-based RDF term to an RDFJS term.
 * @param {string} value A string-based RDF-term.
 * @param {RDF.DataFactory} dataFactory An optional datafactory to create terms with.
 * @return {RDF.Term} An RDF-JS term.
 */
export function stringToTerm(value: string | undefined, dataFactory?: RDF.DataFactory<RDF.BaseQuad>): RDF.Term {
  dataFactory = dataFactory || FACTORY;
  if (!value || !value.length) {
    return dataFactory.defaultGraph();
  }
  switch (value[0]) {
  case '_': return dataFactory.blankNode(value.substr(2));
  case '?':
    if (!dataFactory.variable) {
      throw new Error(`Missing 'variable()' method on the given DataFactory`);
    }
    return dataFactory.variable(value.substr(1));
  case '"':
    const language: string = getLiteralLanguage(value);
    const direction = getLiteralDirection(value);
    const type: RDF.NamedNode = dataFactory.namedNode(getLiteralType(value));
    return dataFactory.literal(getLiteralValue(value), language ? { language, direction } : type);
  case '<':
  default:
    if (value[0] === '<' && value.length > 4 && value[1] === '<' && value[value.length - 1] === '>' && value[value.length - 2] === '>') {
      // Iterate character-by-character to detect spaces that are *not* wrapped in <<>>
      const terms = value.slice(2, -2).trim();
      let stringTerms: string[] = [];
      let ignoreTags: number = 0;
      let lastIndex = 0;
      let inQuote = false;
      for (let i = 0; i < terms.length; i++) {
        const char = terms[i];
        if (char === '<') ignoreTags++;
        if (char === '>') {
          if (ignoreTags === 0) {
            throw new Error('Found closing tag without opening tag in ' + value);
          } else {
            ignoreTags--
          }
        }
        if (char === '"') {
          let escaped = false
          let j = i;
          while (j-- > 0 && terms[j] === '\\') {
            escaped = !escaped;
          }
          if (!escaped) {
            // We have reached an unescaped quote
            inQuote = !inQuote;
          }
        }
        if (char === ' ' && !inQuote && ignoreTags === 0) {
          stringTerms.push(terms.slice(lastIndex, i));

          while (terms[i + 1] === ' ') {
            i += 1;
          }

          lastIndex = i + 1;
        }
      }
      if (ignoreTags !== 0) {
        throw new Error('Found opening tag without closing tag in ' + value);
      }
      stringTerms.push(terms.slice(lastIndex, terms.length));

      // We require 3 or 4 components
      if (stringTerms.length !== 3 && stringTerms.length !== 4) {
        throw new Error('Nested quad syntax error ' + value);
      }

      stringTerms = stringTerms.map(term => term.startsWith('<') && !term.includes(' ') ? term.slice(1, -1) : term)

      return dataFactory.quad(
        stringToTerm(stringTerms[0]),
        stringToTerm(stringTerms[1]),
        stringToTerm(stringTerms[2]),
        stringTerms[3] ? stringToTerm(stringTerms[3]) : undefined,
      );
    }
    return dataFactory.namedNode(value);
  }
}

/**
 * Convert an RDFJS quad to a string-based quad representation.
 * @param {Quad} q An RDFJS quad.
 * @return {IStringQuad} A hash with string-based quad terms.
 * @template Q The type of quad, defaults to RDF.Quad.
 */
export function quadToStringQuad<Q extends RDF.BaseQuad = RDF.Quad>(q: Q): IStringQuad {
  // tslint:disable:object-literal-sort-keys
  return {
    subject: termToString(q.subject),
    predicate: termToString(q.predicate),
    object: termToString(q.object),
    graph: termToString(q.graph),
  };
  // tslint:enable:object-literal-sort-keys
}

/**
 * Convert a string-based quad representation to an RDFJS quad.
 * @param {IStringQuad} stringQuad A hash with string-based quad terms.
 * @param {RDF.DataFactory} dataFactory An optional datafactory to create terms with.
 * @return {Q} An RDFJS quad.
 * @template Q The type of quad, defaults to RDF.Quad.
 */
export function stringQuadToQuad<Q extends RDF.BaseQuad = RDF.Quad>(stringQuad: IStringQuad,
                                                                    dataFactory?: RDF.DataFactory<Q>): Q {
  dataFactory = <RDF.DataFactory<Q>> dataFactory || FACTORY;
  return dataFactory.quad(
    stringToTerm(stringQuad.subject, dataFactory),
    stringToTerm(stringQuad.predicate, dataFactory),
    stringToTerm(stringQuad.object, dataFactory),
    stringToTerm(stringQuad.graph, dataFactory),
  );
}

export interface IStringQuad {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
}
