# Contributing to AI Workers samples

Thanks for improving these Linconwaves AI Workers examples! Here’s how to get involved.

## Ways to contribute
- File issues for bugs, setup problems, or feature ideas.
- Open PRs that improve docs, fix bugs, or add focused examples.
- Share workflows that pair AI Workers with other tools.

## Opening an issue
- Search existing issues first.
- Include steps to reproduce, expected vs. actual behavior, and environment details.
- For feature ideas, describe the problem and proposed solution.

## Pull request flow
1. Fork the repo and create a branch (`feature/<topic>` or `fix/<issue>`).
2. Make changes with clear commits and concise messages.
3. Run checks where relevant:
   - Backend: `cd examples/StoreCanvas/server && npm install && npm test`
   - Frontend: `cd examples/StoreCanvas/client && npm install && npm run lint && npm run typecheck`
4. Open a PR with:
   - What changed and why.
   - How you tested it.
   - Any follow-up todos or known gaps.
5. Keep PRs small and scoped; larger efforts are easier to review in pieces.

## Coding notes
- TypeScript + ESLint + Prettier are used in the StoreCanvas example; align with existing patterns.
- Prefer environment-driven configuration (see `.env.example` in the server).
- Avoid breaking the public example flows unless the PR explicitly updates docs to match.

## License
By contributing, you agree that your contributions will be licensed under the MIT License.
