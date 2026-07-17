# Validated PFE modification workflow

## Student flow

1. A PFE with status `Validé` is displayed as locked.
2. The student clicks **Demander une modification** and submits a reason.
3. Only one request can remain `En attente` for the same PFE.
4. The form stays locked until a responsible user approves the request.
5. After approval, the PFE status becomes `Modifications demandées` and the form becomes editable.
6. The student saves the corrections and submits the subject through the normal validation workflow again.

## Decision flow

A pending request can be processed by:

- the assigned academic supervisor;
- the head of the PFE's department;
- a Super Admin.

Approval reopens the form and clears the timestamps of the previous validation cycle. Rejection keeps the PFE validated and requires a reason. Notifications and audit entries are created for both the request and the decision.

## Database update

Run the new migration after replacing the project files:

```bash
cd backend
php artisan migrate
```

The migration creates the `pfe_modification_requests` table.

## Verification

```bash
cd frontend
npm run build

cd ../backend
php artisan test --filter=PfeModificationRequestTest
```
