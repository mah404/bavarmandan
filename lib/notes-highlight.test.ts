import assert from "node:assert/strict";
import { highlight } from "@/lib/notes-highlight";

assert.equal(highlight("امکان ذاتی در این متن آمده است.", ["امکان ذاتی", "امکان"]), "<b>امکان ذاتی</b> در این متن آمده است.");
assert.equal(highlight("موجود اینجا نباید وجود را جدا طلایی کند.", ["وجود"]), "موجود اینجا نباید وجود را جدا طلایی کند.");
assert.equal(highlight("این **عبارت مهم** است.", []), "این <b>عبارت مهم</b> است.");
assert.equal(highlight("<script>alert(1)</script>", []), "&lt;script&gt;alert(1)&lt;/script&gt;");
