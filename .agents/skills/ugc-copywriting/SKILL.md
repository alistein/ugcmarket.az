---
name: ugc-copywriting
description: Mandatory rules for every user-facing string in UGCMarket (messages/*.json, emails, placeholders, toasts, metadata, landing). Use whenever you write or change copy in az, ru or en.
---

# UGCMarket copywriting rules (must, everywhere)

These rules come from the founders and apply to **all** user-facing text: `messages/*.json`,
Supabase email templates, placeholders, toasts, page metadata, landing copy and demo data in `/ui-kit`.

## 1. No em dash
- Never use the em dash `—` in any language. Use a period, a comma or a colon instead.
- Split the thought into two sentences when in doubt.
- The en dash `–` is allowed only inside numeric ranges (`3–30 simvol`).
- `pnpm copy:check` fails on any em dash in messages, templates and string literals. Run it before committing.

## 2. Azerbaijani is written, not translated
- `messages/az.json` is the source of truth. Write it first, in natural Azerbaijani, as a native copywriter would.
- Never translate word by word from English or Russian. Rebuild the sentence the way people say it in Azerbaijani.
- App UI addresses the user formally with **siz**: `Sizin profiliniz`, `edə bilərsiniz`, `tamamlayın`.
- Always use the correct letters (ə, ı, ş, ç, ğ, ö, ü, İ), even if the brief was typed without them.

Example from the founders:

| Don't (literal, em dash, informal) | Do |
|---|---|
| Profilin yoxlanılır. Adətən 24 saat çəkir. Təsdiqdən sonra elanlara müraciət edə bilərsən — bu vaxt profilini tamamla. | Profiliniz 24 saat ərzində aktivləşəcək. Təsdiqdən sonra elanlara müraciət edə biləcəksiniz. Bu müddət ərzində profilinizi tamamlayın. |

More patterns:

| Calque / awkward | Natural |
|---|---|
| Yenidən xoş gəldin | Xoş gəlmisiniz |
| İstəyə bağlı — təxmini qiymət… | Bu addım məcburi deyil. Təxmini qiymət… |
| Linkin vaxtı keçib | Linkin vaxtı bitib |
| Nəsə alınmadı | Xəta baş verdi. Yenidən cəhd edin. |
| Şəkli yükləmək alınmadı | Şəkli yükləmək mümkün olmadı. |

## 3. Finish the sentences
- Body text, hints, error and validation messages, toasts and notes are full sentences and **end with a period**.
- Titles, field labels, buttons, tabs, chips and badges are short and have **no** period.
- Buttons use the short imperative common in Azerbaijani apps: `Davam et`, `Yadda saxla`, `Daxil ol`, `Ləğv et`.

## 4. Russian and English
- Russian: formal «вы», no em dash, full sentences with a period.
- English: plain and short, no em dash, full sentences with a period.
- Keep the meaning of the Azerbaijani text, not its word order.

## 5. Terms and voice (decided)
- **Elan**, not *kampaniya*, for a brand's listing in Azerbaijani: `Elanlar`, `Elan yerləşdir`, `elanlara müraciət edin`.
  Mind the suffixes: elanı, elana, elanın, elanda (not -ya/-nı forms of *kampaniya*). Code identifiers stay `campaign`.
- **Siz everywhere**, landing page included. The landing keeps its lowercase marketing style, but addresses the reader with *siz*.
- One term per concept. Before introducing a new word for an existing concept, check `messages/az.json` and ask the founders.

## Checklist before committing copy
1. az written first, natively, with siz, *elan* for listings and correct letters.
2. No `—` anywhere (`pnpm copy:check`).
3. Sentences end with a period; labels and buttons don't.
4. ru and en updated with the same meaning.
