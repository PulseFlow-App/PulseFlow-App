# Company-only features (subscription)

Personal workspaces are free and solo. These capabilities stay **company-only**
(trial + paid subscription for the company owner). Explain them on the marketing
landing (`pulseflow-site`) under “why subscribe”.

| Feature | Personal | Company |
|---------|----------|---------|
| Villas, tasks, bills | Yes | Yes |
| Contacts as phone book (save + call) | Yes | Yes |
| Invite teammates | No | Yes |
| Assign villas to team | No | Yes |
| In-app team chat | No | Yes |
| Book / Order contacts in-app | No | Yes (linked PulseFlow users only) |
| WhatsApp / LINE deep links from contacts | No* | Yes |
| Endorsements (weekly reputation) | No | Yes |
| Leaderboard | No | Yes |
| Billing / Stripe | Never | Owner pays after trial |

\* Personal contacts are call-only so the phone book stays simple.

App gates live in `src/lib/roles.ts`:
`canInvite`, `canManageVillaAssignments`, `canBookServices`,
`canUseTeamChat`, `canUseTeamReputation`.
