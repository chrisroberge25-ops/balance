"use client";

export function ConfirmDelete({ action, id }: { action: (formData: FormData) => void; id: string }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm("Delete this entry?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-xs font-medium text-red-800 hover:underline">Delete</button>
    </form>
  );
}
