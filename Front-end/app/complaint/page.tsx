import { ComplaintForm } from "./complaint-form";

export default function ComplaintPage() {
  return (
    <div className="container mx-auto py-10 h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full">
        <div>
          <h1 className="text-3xl font-bold">File a Complaint</h1>
          <p className="mt-4 text-muted-foreground">
            Your voice matters. By submitting a complaint, you help us identify
            and address issues, ensuring a safer and more transparent community.
            All submissions are treated with the utmost confidentiality.
          </p>
          <div className="mt-8 space-y-4">
            <div>
              <h2 className="font-semibold">
                What to include in your complaint:
              </h2>
              <ul className="mt-2 list-disc list-inside text-muted-foreground">
                <li>A clear and concise title.</li>
                <li>A detailed description of the incident.</li>
                <li>The category that best fits your complaint.</li>
                <li>The approximate date and location of the incident.</li>
                <li>Any supporting evidence you may have.</li>
              </ul>
            </div>
            <div>
              <h2 className="font-semibold">Our Commitment to You:</h2>
              <p className="mt-2 text-muted-foreground">
                We are committed to a fair and thorough investigation of every
                complaint. Your submission will be reviewed by our team, and we
                will take appropriate action.
              </p>
            </div>
          </div>
        </div>
        <div className="h-full overflow-auto px-5">
          <ComplaintForm />
        </div>
      </div>
    </div>
  );
}
