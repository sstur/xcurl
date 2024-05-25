import { parseHeaderValue } from '../parseHeaderValue';

function parse(input: string) {
  const [value, params] = parseHeaderValue(input);
  const objParams: Record<string, string> = Object.fromEntries(params);
  return [value, objParams] as const;
}

describe('parseHeaderValue', () => {
  it('should parse basic ASCII', () => {
    expect(parse('')).toEqual(['', {}]);
    expect(parse('foo')).toEqual(['foo', {}]);
    expect(parse('foo;')).toEqual(['foo', {}]);
    expect(parse('; foo=bar')).toEqual(['', { foo: 'bar' }]);
    expect(parse(';foo=bar ')).toEqual(['', { foo: 'bar' }]);
    expect(parse('foo; foo=1; bar=2')).toEqual(['foo', { foo: '1', bar: '2' }]);
    expect(parse('attachment; filename="foo.pdf"')).toEqual([
      'attachment',
      { filename: 'foo.pdf' },
    ]);
    expect(parse('attachment; filename="a;b.pdf"')).toEqual([
      'attachment',
      { filename: 'a;b.pdf' },
    ]);
  });

  it('should parse RFC 5987 encoded with UTF-8', () => {
    expect(parse(`hello; filename*=UTF-8''foo%c3%a4`)).toEqual([
      'hello',
      { filename: 'fooä' },
    ]);
  });

  it('should parse RFC 5987 encoded with UTF-8', () => {
    expect(parse(`hello; filename*=ISO-8859-1''foo%a2`)).toEqual([
      'hello',
      { filename: 'foo¢' },
    ]);
  });

  it('should parse RFC 5987 encoded with invalid UTF-8', () => {
    expect(parse(`hello; filename*=UTF-8''foo%a2`)).toEqual([
      'hello',
      { filename: 'foo¢' },
    ]);
  });

  // Tests from https://github.com/Methuselah96/content-disposition-header/blob/55ce6ad/test/test.ts
  describe('with only type', () => {
    it('should parse "attachment"', () => {
      expect(parse('attachment')).toEqual(['attachment', {}]);
    });

    it('should parse "inline"', () => {
      expect(parse('inline')).toEqual(['inline', {}]);
    });

    it('should parse "form-data"', () => {
      expect(parse('form-data')).toEqual(['form-data', {}]);
    });

    it('should parse with trailing LWS', () => {
      expect(parse('attachment \t ')).toEqual(['attachment', {}]);
    });

    it('should normalize to lower-case', () => {
      expect(parse('ATTACHMENT')).toEqual(['attachment', {}]);
    });
  });

  describe('with parameters', () => {
    it('should allow trailing semicolon', () => {
      expect(parse('attachment; filename="rates.pdf";')).toEqual([
        'attachment',
        { filename: 'rates.pdf' },
      ]);
    });

    it('should allow missing parameter value', () => {
      expect(parse('attachment; filename=')).toEqual([
        'attachment',
        { filename: '' },
      ]);
    });

    it('should allow invalid parameter value', () => {
      expect(parse('attachment; filename=trolly,trains')).toEqual([
        'attachment',
        { filename: 'trolly,trains' },
      ]);
    });

    it('should allow invalid parameters', () => {
      expect(parse('attachment; filename=total/; foo=bar')).toEqual([
        'attachment',
        { filename: 'total/', foo: 'bar' },
      ]);
    });

    it('should overwrite duplicate parameters', () => {
      expect(parse('attachment; filename=foo; filename=bar')).toEqual([
        'attachment',
        { filename: 'bar' },
      ]);
    });

    it('should allow empty or malformed type', () => {
      expect(parse('filename="plans.pdf"')).toEqual(['filename', {}]);
      expect(parse('; filename="plans.pdf"')).toEqual([
        '',
        { filename: 'plans.pdf' },
      ]);
    });

    it('should lower-case parameter name', () => {
      expect(parse('attachment; FILENAME="plans.pdf"')).toEqual([
        'attachment',
        { filename: 'plans.pdf' },
      ]);
    });

    it('should parse quoted parameter value', () => {
      expect(parse('attachment; filename="plans.pdf"')).toEqual([
        'attachment',
        { filename: 'plans.pdf' },
      ]);
    });

    it('should allow escaped quotes in quoted value', () => {
      expect(parse('attachment; filename="the \\"plans\\".pdf"')).toEqual([
        'attachment',
        { filename: 'the "plans".pdf' },
      ]);
    });

    it('should include all parameters', () => {
      expect(parse('attachment; filename="plans.pdf"; foo=bar')).toEqual([
        'attachment',
        { filename: 'plans.pdf', foo: 'bar' },
      ]);
    });

    it('should parse parameters separated with any LWS', () => {
      expect(
        parse('attachment;filename="plans.pdf" \t;    \t\t foo=bar'),
      ).toEqual(['attachment', { filename: 'plans.pdf', foo: 'bar' }]);
    });

    it('should parse token filename', () => {
      expect(parse('attachment; filename=plans.pdf')).toEqual([
        'attachment',
        { filename: 'plans.pdf' },
      ]);
    });

    it('should parse ISO-8859-1 filename', () => {
      expect(parse('attachment; filename="£ rates.pdf"')).toEqual([
        'attachment',
        { filename: '£ rates.pdf' },
      ]);
    });
  });

  describe('with extended parameters', () => {
    it('should allow quoted extended parameter value', () => {
      expect(
        parse('attachment; filename*="UTF-8\'\'%E2%82%AC%20rates.pdf"'),
      ).toEqual(['attachment', { filename: `€ rates.pdf` }]);
    });

    it('should parse UTF-8 extended parameter value', () => {
      expect(
        parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf"),
      ).toEqual(['attachment', { filename: '€ rates.pdf' }]);
    });

    it('should allow invalid encoded UTF-8', () => {
      expect(parse("attachment; filename*=UTF-8''%E4%20rates.pdf")).toEqual([
        'attachment',
        { filename: 'ä rates.pdf' },
      ]);
    });

    it('should parse ISO-8859-1 extended parameter value', () => {
      expect(
        parse("attachment; filename*=ISO-8859-1''%A3%20rates.pdf"),
      ).toEqual(['attachment', { filename: '£ rates.pdf' }]);
    });

    it('should not be case-sensitive for charset', () => {
      expect(
        parse("attachment; filename*=utf-8''%E2%82%AC%20rates.pdf"),
      ).toEqual(['attachment', { filename: '€ rates.pdf' }]);
    });

    it('should ignore unsupported charset', () => {
      expect(
        parse("attachment; filename*=ISO-8859-2''%A4%20rates.pdf"),
      ).toEqual(['attachment', { filename: `ISO-8859-2''¤ rates.pdf` }]);
    });

    it('should parse with embedded language', () => {
      expect(
        parse("attachment; filename*=UTF-8'en'%E2%82%AC%20rates.pdf"),
      ).toEqual(['attachment', { filename: '€ rates.pdf' }]);
    });

    it('should use last parameter', () => {
      expect(
        parse(
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
        ),
      ).toEqual(['attachment', { filename: '€ rates.pdf' }]);
      expect(
        parse(
          'attachment; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf; filename="EURO rates.pdf"',
        ),
      ).toEqual(['attachment', { filename: 'EURO rates.pdf' }]);
    });
  });

  describe('Disposition-Type Inline', () => {
    it('should parse "inline"', () => {
      expect(parse('inline')).toEqual(['inline', {}]);
      expect(parse('"inline"')).toEqual(['inline', {}]);
    });

    it('should parse "inline; filename="foo.html""', () => {
      expect(parse('inline; filename="foo.html"')).toEqual([
        'inline',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse "inline; filename="Not an attachment!""', () => {
      expect(parse('inline; filename="Not an attachment!"')).toEqual([
        'inline',
        { filename: 'Not an attachment!' },
      ]);
    });

    it('should parse "inline; filename="foo.pdf""', () => {
      expect(parse('inline; filename="foo.pdf"')).toEqual([
        'inline',
        { filename: 'foo.pdf' },
      ]);
    });
  });

  describe('Disposition-Type Attachment', () => {
    it('should parse "attachment"', () => {
      expect(parse('attachment')).toEqual(['attachment', {}]);
    });

    it('should allow ""attachment""', () => {
      expect(parse('"attachment"')).toEqual(['attachment', {}]);
    });

    it('should parse "ATTACHMENT"', () => {
      expect(parse('ATTACHMENT')).toEqual(['attachment', {}]);
    });

    it('should parse "attachment; filename="foo.html""', () => {
      expect(parse('attachment; filename="foo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename="0000000000111111111122222""', () => {
      expect(parse('attachment; filename="0000000000111111111122222"')).toEqual(
        ['attachment', { filename: '0000000000111111111122222' }],
      );
    });

    it('should parse "attachment; filename="00000000001111111111222222222233333""', () => {
      expect(
        parse('attachment; filename="00000000001111111111222222222233333"'),
      ).toEqual([
        'attachment',
        { filename: '00000000001111111111222222222233333' },
      ]);
    });

    it('should parse "attachment; filename="f\\oo.html""', () => {
      expect(parse('attachment; filename="f\\oo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename="\\"quoting\\" tested.html""', () => {
      expect(parse('attachment; filename="\\"quoting\\" tested.html"')).toEqual(
        ['attachment', { filename: '"quoting" tested.html' }],
      );
    });

    it('should parse "attachment; filename="Here\'s a semicolon;.html""', () => {
      expect(parse('attachment; filename="Here\'s a semicolon;.html"')).toEqual(
        ['attachment', { filename: "Here's a semicolon;.html" }],
      );
    });

    it('should parse "attachment; foo="bar"; filename="foo.html""', () => {
      expect(parse('attachment; foo="bar"; filename="foo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html', foo: 'bar' },
      ]);
    });

    it('should parse "attachment; foo="\\"\\\\";filename="foo.html""', () => {
      expect(parse('attachment; foo="\\"\\\\";filename="foo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html', foo: '"\\' },
      ]);
    });

    it('should parse "attachment; FILENAME="foo.html""', () => {
      expect(parse('attachment; FILENAME="foo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename=foo.html"', () => {
      expect(parse('attachment; filename=foo.html')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename=foo,bar.html"', () => {
      expect(parse('attachment; filename=foo,bar.html')).toEqual([
        'attachment',
        { filename: 'foo,bar.html' },
      ]);
    });

    it('should allow "attachment; filename=foo.html ;"', () => {
      expect(parse('attachment; filename=foo.html ;')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should allow "attachment; ;filename=foo"', () => {
      expect(parse('attachment; ;filename=foo')).toEqual([
        'attachment',
        { filename: 'foo' },
      ]);
    });

    it('should allow "attachment; filename=foo bar.html"', () => {
      expect(parse('attachment; filename=foo bar.html')).toEqual([
        'attachment',
        { filename: 'foo bar.html' },
      ]);
    });

    it("should parse \"attachment; filename='foo.bar'", () => {
      expect(parse("attachment; filename='foo.bar'")).toEqual([
        'attachment',
        { filename: "'foo.bar'" },
      ]);
    });

    it('should parse "attachment; filename="foo-ä.html""', () => {
      expect(parse('attachment; filename="foo-ä.html"')).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename="foo-Ã¤.html""', () => {
      expect(parse('attachment; filename="foo-Ã¤.html"')).toEqual([
        'attachment',
        { filename: 'foo-Ã¤.html' },
      ]);
    });

    it('should parse "attachment; filename="foo-%41.html""', () => {
      expect(parse('attachment; filename="foo-%41.html"')).toEqual([
        'attachment',
        { filename: 'foo-A.html' },
      ]);
    });

    it('should parse "attachment; filename="50%.html""', () => {
      expect(parse('attachment; filename="50%.html"')).toEqual([
        'attachment',
        { filename: '50%.html' },
      ]);
    });

    it('should parse "attachment; filename="foo-%\\41.html""', () => {
      expect(parse('attachment; filename="foo-%\\41.html"')).toEqual([
        'attachment',
        { filename: 'foo-A.html' },
      ]);
    });

    it('should parse "attachment; name="foo-%41.html""', () => {
      expect(parse('attachment; name="foo-%41.html"')).toEqual([
        'attachment',
        { name: 'foo-A.html' },
      ]);
    });

    it('should parse "attachment; filename="ä-%41.html""', () => {
      expect(parse('attachment; filename="ä-%41.html"')).toEqual([
        'attachment',
        { filename: 'ä-A.html' },
      ]);
    });

    it('should parse "attachment; filename="foo-%c3%a4-%e2%82%ac.html""', () => {
      expect(parse('attachment; filename="foo-%c3%a4-%e2%82%ac.html"')).toEqual(
        ['attachment', { filename: 'foo-ä-€.html' }],
      );
    });

    it('should parse "attachment; filename ="foo.html""', () => {
      expect(parse('attachment; filename ="foo.html"')).toEqual([
        'attachment',
        { filename: 'foo.html' },
      ]);
    });

    it('should allow duplicates', () => {
      expect(
        parse('attachment; filename="foo.html"; filename="bar.html"'),
      ).toEqual(['attachment', { filename: 'bar.html' }]);
    });

    it('should allow "attachment; filename=foo[1](2).html"', () => {
      expect(parse('attachment; filename=foo[1](2).html')).toEqual([
        'attachment',
        { filename: 'foo[1](2).html' },
      ]);
    });

    it('should parse "attachment; filename=foo-ä.html"', () => {
      expect(parse('attachment; filename=foo-ä.html')).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename=foo-Ã¤.html"', () => {
      expect(parse('attachment; filename=foo-Ã¤.html')).toEqual([
        'attachment',
        { filename: 'foo-Ã¤.html' },
      ]);
    });

    it('should parse "filename=foo.html"', () => {
      expect(parse('filename=foo.html')).toEqual(['filename', {}]);
    });

    it('should parse "x=y; filename=foo.html"', () => {
      expect(parse('x=y; filename=foo.html')).toEqual([
        'x',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse ""foo; filename=bar;baz"; filename=qux"', () => {
      expect(parse('"foo; filename=bar;baz"; filename=qux')).toEqual([
        'foo; filename=bar;baz',
        { filename: 'qux' },
      ]);
    });

    it('should parse "filename=foo.html, filename=bar.html"', () => {
      expect(parse('filename=foo.html, filename=bar.html')).toEqual([
        'filename',
        {},
      ]);
    });

    it('should parse "; filename=foo.html"', () => {
      expect(parse('; filename=foo.html')).toEqual([
        '',
        { filename: 'foo.html' },
      ]);
    });

    it('should parse ": inline; attachment; filename=foo.html', () => {
      expect(parse(': inline; attachment; filename=foo.html')).toEqual([
        ': inline',
        { attachment: '', filename: 'foo.html' },
      ]);
    });

    it('should parse "inline; attachment; filename=foo.html', () => {
      expect(parse('inline; attachment; filename=foo.html')).toEqual([
        'inline',
        { attachment: '', filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; inline; filename=foo.html', () => {
      expect(parse('attachment; inline; filename=foo.html')).toEqual([
        'attachment',
        { inline: '', filename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename="foo.html".txt', () => {
      expect(parse('attachment; filename="foo.html".txt')).toEqual([
        'attachment',
        { filename: 'foo.html.txt' },
      ]);
    });

    it('should parse "attachment; filename="bar', () => {
      expect(parse('attachment; filename="bar')).toEqual([
        'attachment',
        { filename: '"bar' },
      ]);
    });

    it('should parse "attachment; filename=foo"bar;baz"qux', () => {
      expect(parse('attachment; filename=foo"bar;baz"qux')).toEqual([
        'attachment',
        { filename: 'foobar;bazqux' },
      ]);
    });

    it('should parse "attachment; filename=foo.html, attachment; filename=bar.html', () => {
      expect(
        parse('attachment; filename=foo.html, attachment; filename=bar.html'),
      ).toEqual(['attachment', { filename: 'bar.html' }]);
    });

    it('should parse "attachment; foo=foo filename=bar', () => {
      expect(parse('attachment; foo=foo filename=bar')).toEqual([
        'attachment',
        { foo: 'foo filename' },
      ]);
    });

    it('should parse "attachment; filename=bar foo=foo', () => {
      expect(parse('attachment; filename=bar foo=foo')).toEqual([
        'attachment',
        { filename: 'bar foo' },
      ]);
    });

    it('should parse "attachment filename=bar', () => {
      expect(parse('attachment filename=bar')).toEqual([
        'attachment filename',
        {},
      ]);
    });

    it('should parse "filename=foo.html; attachment', () => {
      expect(parse('filename=foo.html; attachment')).toEqual([
        'filename',
        { attachment: '' },
      ]);
    });

    it('should parse "attachment; xfilename=foo.html"', () => {
      expect(parse('attachment; xfilename=foo.html')).toEqual([
        'attachment',
        { xfilename: 'foo.html' },
      ]);
    });

    it('should parse "attachment; filename="/foo.html""', () => {
      expect(parse('attachment; filename="/foo.html"')).toEqual([
        'attachment',
        { filename: '/foo.html' },
      ]);
    });

    it('should parse "attachment; filename="\\\\foo.html""', () => {
      expect(parse('attachment; filename="\\\\foo.html"')).toEqual([
        'attachment',
        { filename: '\\foo.html' },
      ]);
    });
  });

  describe('Additional Parameters', () => {
    it('should parse "attachment; creation-date="Wed, 12 Feb 1997 16:29:51 -0500""', () => {
      expect(
        parse('attachment; creation-date="Wed, 12 Feb 1997 16:29:51 -0500"'),
      ).toEqual([
        'attachment',
        { 'creation-date': 'Wed, 12 Feb 1997 16:29:51 -0500' },
      ]);
    });

    it('should parse "attachment; modification-date="Wed, 12 Feb 1997 16:29:51 -0500""', () => {
      expect(
        parse(
          'attachment; modification-date="Wed, 12 Feb 1997 16:29:51 -0500"',
        ),
      ).toEqual([
        'attachment',
        {
          'modification-date': 'Wed, 12 Feb 1997 16:29:51 -0500',
        },
      ]);
    });
  });

  describe('Disposition-Type Extension', () => {
    it('should parse "foobar"', () => {
      expect(parse('foobar')).toEqual(['foobar', {}]);
    });

    it('should parse "attachment; example="filename=example.txt""', () => {
      expect(parse('attachment; example="filename=example.txt"')).toEqual([
        'attachment',
        { example: 'filename=example.txt' },
      ]);
    });
  });

  describe('RFC 2231/5987 Encoding: Character Sets', () => {
    it('should parse "attachment; filename*=iso-8859-1\'\'foo-%E4.html"', () => {
      expect(parse("attachment; filename*=iso-8859-1''foo-%E4.html")).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'foo-%c3%a4-%e2%82%ac.html"', () => {
      expect(
        parse("attachment; filename*=UTF-8''foo-%c3%a4-%e2%82%ac.html"),
      ).toEqual(['attachment', { filename: 'foo-ä-€.html' }]);
    });

    it('should parse "attachment; filename*=\'\'foo-%c3%a4-%e2%82%ac.html"', () => {
      expect(
        parse("attachment; filename*=''foo-%c3%a4-%e2%82%ac.html"),
      ).toEqual(['attachment', { filename: `''foo-ä-€.html` }]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'foo-a%cc%88.html"', () => {
      expect(parse("attachment; filename*=UTF-8''foo-a%cc%88.html")).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename*=iso-8859-1\'\'foo-%c3%a4-%e2%82%ac.html"', () => {
      expect(
        parse("attachment; filename*=iso-8859-1''foo-%c3%a4-%e2%82%ac.html"),
      ).toEqual(['attachment', { filename: 'foo-ä-€.html' }]);
    });

    it('should parse "attachment; filename*=utf-8\'\'foo-%E4.html"', () => {
      expect(parse("attachment; filename*=utf-8''foo-%E4.html")).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename *=UTF-8\'\'foo-%c3%a4.html"', () => {
      expect(parse("attachment; filename *=UTF-8''foo-%c3%a4.html")).toEqual([
        'attachment',
        { 'filename ': 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename*= UTF-8\'\'foo-%c3%a4.html"', () => {
      expect(parse("attachment; filename*= UTF-8''foo-%c3%a4.html")).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename* =UTF-8\'\'foo-%c3%a4.html"', () => {
      expect(parse("attachment; filename* =UTF-8''foo-%c3%a4.html")).toEqual([
        'attachment',
        { filename: 'foo-ä.html' },
      ]);
    });

    it('should parse "attachment; filename*="UTF-8\'\'foo-%c3%a4.html""', () => {
      expect(parse('attachment; filename*="UTF-8\'\'foo-%c3%a4.html"')).toEqual(
        ['attachment', { filename: 'foo-ä.html' }],
      );
    });

    it('should parse "attachment; filename*="foo%20bar.html""', () => {
      expect(parse('attachment; filename*="foo%20bar.html"')).toEqual([
        'attachment',
        { filename: 'foo bar.html' },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'foo-%c3%a4.html"', () => {
      expect(parse("attachment; filename*=UTF-8'foo-%c3%a4.html")).toEqual([
        'attachment',
        { filename: "UTF-8'foo-ä.html" },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'foo%"', () => {
      expect(parse("attachment; filename*=UTF-8''foo%")).toEqual([
        'attachment',
        { filename: 'foo%' },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'f%oo.html"', () => {
      expect(parse("attachment; filename*=UTF-8''f%oo.html")).toEqual([
        'attachment',
        { filename: 'f%oo.html' },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'A-%2541.html"', () => {
      expect(parse("attachment; filename*=UTF-8''A-%2541.html")).toEqual([
        'attachment',
        { filename: 'A-%41.html' },
      ]);
    });

    it('should parse "attachment; filename*=UTF-8\'\'%5cfoo.html"', () => {
      expect(parse("attachment; filename*=UTF-8''%5cfoo.html")).toEqual([
        'attachment',
        { filename: '\\foo.html' },
      ]);
    });
  });
});
