import {blankNode, defaultGraph, literal, namedNode, quad, triple, variable} from "@rdfjs/data-model";
import * as DataFactory from "@rdfjs/data-model";
import * as RDF from "rdf-js";
import * as TermUtil from "../index";

describe('TermUtil', () => {

  describe('#termToString', () => {
    it('should transform a falsy value', async () => {
      expect(TermUtil.termToString(null)).toBeFalsy();
      expect(TermUtil.termToString(undefined)).toBeFalsy();
    });

    it('should transform a named node', async () => {
      return expect(TermUtil.termToString(namedNode('http://example.org'))).toEqual('http://example.org');
    });

    it('should transform a blank node', async () => {
      return expect(TermUtil.termToString(blankNode('b1'))).toEqual('_:b1');
    });

    it('should transform a variable', async () => {
      return expect(TermUtil.termToString(variable('v1'))).toEqual('?v1');
    });

    it('should transform the default graph', async () => {
      return expect(TermUtil.termToString(defaultGraph())).toEqual('');
    });

    it('should transform a literal', async () => {
      return expect(TermUtil.termToString(literal('abc'))).toEqual('"abc"');
    });

    it('should transform a literal with a language', async () => {
      return expect(TermUtil.termToString(literal('abc', 'en'))).toEqual('"abc"@en');
    });

    it('should transform a literal with a datatype', async () => {
      return expect(TermUtil.termToString(literal('abc', namedNode('http://ex')))).toEqual('"abc"^^http://ex');
    });

    it('should be usable within a map operation on generic term types', async () => {
      const terms: RDF.Term[] = [ namedNode('http://example.org/a'), namedNode('http://example.org/b') ];
      const stringTerms: string[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ 'http://example.org/a', 'http://example.org/b' ]);
    });

    it('should be usable within a map operation on specific term types', async () => {
      const terms: RDF.NamedNode[] = [ namedNode('http://example.org/a'), namedNode('http://example.org/b') ];
      const stringTerms: string[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ 'http://example.org/a', 'http://example.org/b' ]);
    });

    it('should be usable within a map operation on null', async () => {
      const terms: null[] = [ null, null ];
      const stringTerms: undefined[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ undefined, undefined ]);
    });

    it('should be usable within a map operation on undefined', async () => {
      const terms: undefined[] = [ undefined, undefined ];
      const stringTerms: undefined[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ undefined, undefined ]);
    });

    it('should be usable within a map operation on null and undefined', async () => {
      const terms: (null | undefined)[] = [ null, undefined ];
      const stringTerms: undefined[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ undefined, undefined ]);
    });

    it('should be usable within a map operation on terms and undefined', async () => {
      const terms: (RDF.NamedNode | undefined)[] = [ namedNode('http://example.org/a'), undefined ];
      const stringTerms: (string | undefined)[] = terms.map(TermUtil.termToString);
      return expect(stringTerms).toEqual([ 'http://example.org/a', undefined ]);
    });
  });

  describe('#getLiteralValue', () => {
    it('should error on invalid literals', async () => {
      return expect(() => TermUtil.getLiteralValue('"abc')).toThrow();
    });
  });

  describe('#getLiteralType', () => {
    it('should error on invalid literal types', async () => {
      return expect(() => TermUtil.getLiteralType('"abc"h')).toThrow();
    });
  });

  describe('#getLiteralLanguage', () => {
    it('should error on invalid languages', async () => {
      return expect(() => TermUtil.getLiteralLanguage('"abc"@')).toThrow();
    });
  });

  describe('#stringToTerm', () => {
    it('should transform an empty string to default graph', async () => {
      return expect(TermUtil.stringToTerm('')).toEqual(defaultGraph());
    });

    it('should transform a blank node', async () => {
      return expect(TermUtil.stringToTerm('_:b1')).toEqual(blankNode('b1'));
    });

    it('should transform a variable', async () => {
      return expect(TermUtil.stringToTerm('?v1')).toEqual(variable('v1'));
    });

    it('should transform a literal', async () => {
      return expect(TermUtil.stringToTerm('"abc"').equals(literal('abc'))).toBeTruthy();
    });

    it('should transform a literal with a datatype', async () => {
      return expect(TermUtil.stringToTerm('"abc"^^http://blabla')
        .equals(literal('abc', namedNode('http://blabla')))).toBeTruthy();
    });

    it('should transform a literal with a datatype incorrectly', async () => {
      return expect(TermUtil.stringToTerm('"abc"^^http://blabla')
        .equals(literal('abc'))).toBeFalsy();
    });

    it('should transform a literal with a language', async () => {
      return expect(TermUtil.stringToTerm('"abc"@en').equals(literal('abc', 'en'))).toBeTruthy();
    });

    it('should transform a literal with a language incorrectly', async () => {
      return expect(TermUtil.stringToTerm('"abc"@en').equals(literal('abc'))).toBeFalsy();
    });

    it('should transform a default graph', async () => {
      return expect(TermUtil.stringToTerm('')).toEqual(defaultGraph());
    });

    it('should transform a named node', async () => {
      return expect(TermUtil.stringToTerm('http://example.org')).toEqual(namedNode('http://example.org'));
    });

    describe('with a custom data factory', () => {
      it('should transform an empty string to default graph', async () => {
        return expect(TermUtil.stringToTerm('', DataFactory)).toEqual(defaultGraph());
      });

      it('should transform a blank node', async () => {
        return expect(TermUtil.stringToTerm('_:b1', DataFactory)).toEqual(blankNode('b1'));
      });

      it('should transform a variable', async () => {
        return expect(TermUtil.stringToTerm('?v1', DataFactory)).toEqual(variable('v1'));
      });

      it('should throw on transforming a variable when the factory has no variable method', async () => {
        const dataFactory: RDF.DataFactory = <any> {};
        return expect(() => TermUtil.stringToTerm('?v1', dataFactory))
          .toThrow(new Error('Missing \'variable()\' method on the given DataFactory'));
      });

      it('should transform a literal', async () => {
        return expect(TermUtil.stringToTerm('"abc"', DataFactory).equals(literal('abc'))).toBeTruthy();
      });

      it('should transform a literal with a datatype', async () => {
        const typedDataFactory: RDF.DataFactory<RDF.Quad> = DataFactory;

        return expect(TermUtil.stringToTerm('"abc"^^http://blabla', typedDataFactory)
          .equals(literal('abc', namedNode('http://blabla')))).toBeTruthy();
      });

      it('should transform a literal with a datatype incorrectly', async () => {
        return expect(TermUtil.stringToTerm('"abc"^^http://blabla', DataFactory)
          .equals(literal('abc'))).toBeFalsy();
      });

      it('should transform a literal with a language', async () => {
        return expect(TermUtil.stringToTerm('"abc"@en', DataFactory).equals(literal('abc', 'en'))).toBeTruthy();
      });

      it('should transform a literal with a language incorrectly', async () => {
        return expect(TermUtil.stringToTerm('"abc"@en', DataFactory).equals(literal('abc'))).toBeFalsy();
      });

      it('should transform a default graph', async () => {
        return expect(TermUtil.stringToTerm('', DataFactory)).toEqual(defaultGraph());
      });

      it('should transform a named node', async () => {
        return expect(TermUtil.stringToTerm('http://example.org', DataFactory))
          .toEqual(namedNode('http://example.org'));
      });
    });
  });

  describe('#stringQuadToQuad', () => {
    it('should transform a string triple to a triple', async () => {
      return expect(TermUtil.stringQuadToQuad({
        object: '"literal"',
        predicate: 'http://example.org/p',
        subject: 'http://example.org',
      }).equals(triple(
        namedNode('http://example.org'),
        namedNode('http://example.org/p'),
        literal('literal'),
        ))).toBeTruthy();
    });

    it('should transform a string quad to a quad', async () => {
      return expect(TermUtil.stringQuadToQuad({
        graph: 'http://example.org/graph',
        object: '"literal"',
        predicate: 'http://example.org/p',
        subject: 'http://example.org',
      }).equals(quad(
        namedNode('http://example.org'),
        namedNode('http://example.org/p'),
        literal('literal'),
        namedNode('http://example.org/graph'),
      ))).toBeTruthy();
    });

    describe('with a custom data factory', () => {
      it('should transform a string triple to a triple', async () => {
        return expect(TermUtil.stringQuadToQuad({
          object: '"literal"',
          predicate: 'http://example.org/p',
          subject: 'http://example.org',
        }, DataFactory).equals(triple(
          namedNode('http://example.org'),
          namedNode('http://example.org/p'),
          literal('literal'),
        ))).toBeTruthy();
      });

      it('should transform a string quad to a quad', async () => {
        return expect(TermUtil.stringQuadToQuad({
          graph: 'http://example.org/graph',
          object: '"literal"',
          predicate: 'http://example.org/p',
          subject: 'http://example.org',
        }, DataFactory).equals(quad(
          namedNode('http://example.org'),
          namedNode('http://example.org/p'),
          literal('literal'),
          namedNode('http://example.org/graph'),
        ))).toBeTruthy();
      });
    });
  });

  describe('#quadToStringQuad', () => {
    it('should transform a triple to a string triple', async () => {
      return expect(TermUtil.quadToStringQuad(triple(
        namedNode('http://example.org'),
        namedNode('http://example.org/p'),
        literal('literal'),
      ))).toEqual({
        graph: '',
        object: '"literal"',
        predicate: 'http://example.org/p',
        subject: 'http://example.org',
      });
    });

    it('should transform a quad to a string quad', async () => {
      return expect(TermUtil.quadToStringQuad(quad(
        namedNode('http://example.org'),
        namedNode('http://example.org/p'),
        literal('literal'),
        namedNode('http://example.org/graph'),
      ))).toEqual({
        graph: 'http://example.org/graph',
        object: '"literal"',
        predicate: 'http://example.org/p',
        subject: 'http://example.org',
      });
    });
  });
});
