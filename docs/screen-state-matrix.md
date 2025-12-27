# Screen × State × UI Response

| Screen | State | UI response |
| --- | --- | --- |
| Dashboard | Empty / First-use | `ScreenState(first-use)` with CTA to issue invoice and add tax (inline actions). |
| Dashboard | Near-limit (>=80%) | `ScreenState(near-limit, inline)` inside plan banner, linking to Billing. |
| Dashboard | Hard block | `ScreenState(blocked, inline)` inside plan banner, disables actions. |
| Dashboard | Backend error | `ScreenState(error, inline)` with retry. |
| Dashboard | Tenant violation | `ScreenState(tenant)` early return with login + retry. |
| Invoices List | Empty | `ScreenState(empty)` with CTA to issue invoice. |
| Invoices List | First-use | `ScreenState(first-use)` when zero invoices. |
| Invoices List | Near-limit | `ScreenState(near-limit, inline)` before list. |
| Invoices List | Hard block | `ScreenState(blocked, inline)` before list, disables actions/downloads. |
| Invoices List | Backend error | `ScreenState(error, inline)` with retry. |
| Invoices List | Tenant violation | `ScreenState(tenant)` early return. |
| Issue Invoice | Empty / First-use | `ScreenState(first-use|empty, inline)` inside preview card. |
| Issue Invoice | Near-limit | `ScreenState(near-limit, inline)` above form. |
| Issue Invoice | Hard block | `ScreenState(blocked, inline)` above form and inside preview. |
| Issue Invoice | Backend error | `ScreenState(error, inline)` for preview/submit failures. |
| Issue Invoice | Tenant violation | `ScreenState(tenant, inline)` above form and in preview. |
| Team | Empty | `ScreenState(empty, inline)` in table slot. |
| Team | First-use | `ScreenState(first-use, inline)` in table slot with invite CTA. |
| Team | Near-limit | `ScreenState(near-limit, inline)` banner using seat consumption. |
| Team | Hard block | `ScreenState(blocked, inline)` banner and disabled actions. |
| Team | Backend error | `ScreenState(error, inline)` in table slot. |
| Team | Tenant violation | `ScreenState(tenant)` early return. |
| Marketplace | Empty | `ScreenState(empty)` in grid slot. |
| Marketplace | First-use | `ScreenState(first-use)` in grid slot when zero services + zero usage. |
| Marketplace | Near-limit | `ScreenState(near-limit, inline)` banner using invoice usage. |
| Marketplace | Hard block | `ScreenState(blocked)` replacing grid. |
| Marketplace | Backend error | `ScreenState(error, inline)` with retry. |
| Marketplace | Tenant violation | `ScreenState(tenant)` early return. |
| Timeline | Empty | `ScreenState(empty, inline)` before timeline. |
| Timeline | First-use | `ScreenState(first-use, inline)` before timeline when no events. |
| Timeline | Near-limit | `ScreenState(near-limit, inline)` for grace/80% usage. |
| Timeline | Hard block | `ScreenState(blocked, inline)` read-only notice. |
| Timeline | Backend error | `ScreenState(error, inline)` with retry. |
| Timeline | Tenant violation | `ScreenState(tenant)` early return. |
