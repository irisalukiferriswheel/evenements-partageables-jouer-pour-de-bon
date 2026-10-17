import test from 'node:test';
import assert from 'node:assert/strict';
import {withLanguage} from './languageUrl.js';
test('shared language links preserve event identity and never convert payment amounts',()=>{
 const value=withLanguage('https://example.test/register?event=123&amount=25&currency=CAD#details','en');const url=new URL(value);assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.get('event'),'123');assert.equal(url.searchParams.get('amount'),'25');assert.equal(url.searchParams.get('currency'),'CAD');assert.equal(url.hash,'#details');
});
