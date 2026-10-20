<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep verification submission eligibility in a shared browser-safe helper used by the send handler and disabled state, so both enforce the same requirement.
- Keep welcome, example investigations, and submitted conversations as explicit client UI states; do not represent the example verdict as a live verification service.
- Login and history are front-end mocks in src/lib/mock-auth.ts (localStorage) by user request; swap that module for a real backend later.
