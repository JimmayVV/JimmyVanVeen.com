import MainLink from "~/components/main-link";

export function Project({
  title,
  description,
  url,
  screenshotUrl,
  repoUrl,
}: {
  title: string;
  description: string | null;
  url: string | null;
  screenshotUrl?: string;
  repoUrl: string;
}) {
  return (
    <div className="rounded-sm shadow-lg bg-[#3b3b3b]">
      <img src={screenshotUrl} className="rounded-t" alt="" />
      <div className="p-6">
        <h2 className="font-bold uppercase pb-4 border-b-2 border-white/30 tracking-widest">
          {title}
        </h2>
        <p className="text-base my-4">{description}</p>
        {repoUrl ? (
          <MainLink to={repoUrl} external>
            Learn More
          </MainLink>
        ) : null}
        {url ? (
          <MainLink to={url} external>
            View Live Demo
          </MainLink>
        ) : null}
      </div>
    </div>
  );
}

export default Project;
