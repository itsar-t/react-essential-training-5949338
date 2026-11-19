export default function Page() {
  
  async function submitForm(formData) {
    "use server";
    const formFields = {
      email: formData.get("email"),
      message: formData.get("message")
    };
    console.log("formFields", formFields);
    console.log("TODO: send these form field values to a backend");
  }

  return (
    <main className="mx-4 my-6 w-auto max-w-lg rounded-md border p-2 shadow-md sm:mx-auto sm:mt-4 sm:w-full sm:p-6">
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Vill du veta mer?</h1>
        <form className="space-y-4" action={submitForm}>
          <div>
            <label htmlFor="email"
              className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="message">Meddelande</label>
            <textarea
              id="message"
              required
              name="message"
              rows="4"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </textarea>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 cursor-pointer"
          >
            Skicka Meddelande
          </button>
        </form>
      </div>
    </main>
  );
}