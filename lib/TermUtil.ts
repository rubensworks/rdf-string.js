import * as DataFactory from "@rdfjs/data-model";
import * as RDF from "rdf-js";

/**
 * Utility methods for converting between string-based RDF representations and RDFJS objects.
 *
 * RDF Terms are represented as follows:
 * * Blank nodes: '_:myBlankNode'
 * * Variables:   '?myVariable'
 * * Literals:    '"myString"', '"myLanguageString"@en-us', '"3"^^xsd:number'
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
export function termToString(term: RDF.Term): string {
  if (!term) {
    return null;
  }
  switch (term.termType) {
  case 'NamedNode': return term.value;
  case 'BlankNode': return '_:' + term.value;
  case 'Literal':
    const literalValue: RDF.Literal = <RDF.Literal> term;
    return '"' + literalValue.value + '"' +
      (literalValue.datatype &&
      literalValue.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string' &&
      literalValue.datatype.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' ?
        '^^' + literalValue.datatype.value : '') +
      (literalValue.language ? '@' + literalValue.language : '');
  case 'Variable': return '?' + term.value;
  case 'DefaultGraph': return term.value;
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
  return match[1] ? match[1].toLowerCase() : '';
}

/**
 * Transform a string-based RDF term to an RDFJS term.
 * @param {string} value A string-based RDF-term.
 * @param {RDF.DataFactory} dataFactory An optional datafactory to create terms with.
 * @return {RDF.Term} An RDF-JS term.
 */
export function stringToTerm(value: string, dataFactory?: RDF.DataFactory): RDF.Term {
  dataFactory = dataFactory || DataFactory;
  if (!value || !value.length) {
    return dataFactory.defaultGraph();
  }
  switch (value[0]) {
  case '_': return dataFactory.blankNode(value.substr(2));
  case '?': return dataFactory.variable(value.substr(1));
  case '"':
    const language: string = getLiteralLanguage(value);
    const type: RDF.NamedNode = dataFactory.namedNode(getLiteralType(value));
    return dataFactory.literal(getLiteralValue(value), language || type);
  default:  return dataFactory.namedNode(value);
  }
}

/**
 * Convert an RDFJS quad to a string-based quad representation.
 * @param {Quad} q An RDFJS quad.
 * @return {IStringQuad} A hash with string-based quad terms.
 */
export function quadToStringQuad(q: RDF.Quad): IStringQuad {
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
 * @return {Quad} An RDFJS quad.
 */
export function stringQuadToQuad(stringQuad: IStringQuad, dataFactory?: RDF.DataFactory): RDF.Quad {
  dataFactory = dataFactory || DataFactory;
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
