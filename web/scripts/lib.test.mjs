import test from 'node:test';
import assert from 'node:assert/strict';
import {safeRelative,assertSanitized} from './lib.mjs';
test('rejects paths escaping a private bundle',()=>{for(const p of ['../secret','/etc/passwd','media/../secret','https://other/file','media\\x'])assert.throws(()=>safeRelative(p));assert.equal(safeRelative('media/a.png'),'media/a.png');});
test('rejects accidental local identities and credentials',()=>{assert.throws(()=>assertSanitized({source:'/Users/example/private/file'}));assert.throws(()=>assertSanitized({token:'ghp_abcdefghijklmnopqrstuvwx'}));assert.doesNotThrow(()=>assertSanitized({source:'docs/design/vision.md',ruid:'e59cc6d869eb48e0b35bb2ad908fb534'}));});
