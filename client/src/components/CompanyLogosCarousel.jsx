import { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";

const CompanyLogosCarousel = () => {
  const { jobs } = useContext(AppContext);

  const companies = useMemo(() => {
    const seenIds = new Set();
    const seenNames = new Set();
    const result = [];
    jobs.forEach(job => {
      const company = job.companyId;
      if (!company || !company._id) return;
      const logo = company.logo || company.image;
      const normalizedName = company.name?.trim().toLowerCase();
      if (!logo) return;
      if (seenIds.has(String(company._id))) return;
      if (normalizedName && seenNames.has(normalizedName)) return;
      seenIds.add(String(company._id));
      if (normalizedName) seenNames.add(normalizedName);
      result.push({ id: String(company._id), name: company.name, logo });
    });
    return result;
  }, [jobs]);

  if (companies.length === 0) return null;

  const track = [...companies, ...companies];
  const duration = Math.max(18, companies.length * 4);

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll ${duration}s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-white border-t border-gray-100 py-10 pb-14 overflow-hidden select-none">
        <h3 className="text-center font-bold text-3xl md:text-4xl text-gray-900 mb-10">
          Our Trusted Partners
        </h3>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
            style={{ background: "linear-gradient(to right, white, transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
            style={{ background: "linear-gradient(to left, white, transparent)" }}
          />

          <div className="flex marquee-track" style={{ width: "max-content" }}>
            {track.map((company, i) => (
              <div
                key={`${company.id}-${i}`}
                className="flex flex-col items-center justify-center mx-4 flex-shrink-0 border-2 border-gray-200 rounded-2xl bg-white shadow-sm px-6 py-5"
                style={{ minWidth: 140 }}
              >
                <div className="w-16 h-16 flex items-center justify-center overflow-hidden mb-3">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `<span style="color:#1f2937;font-weight:800;font-size:1.5rem">${company.name.charAt(0).toUpperCase()}</span>`;
                    }}
                  />
                </div>
                <p className="text-xs font-bold text-gray-800 text-center leading-tight max-w-[110px] truncate">
                  {company.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyLogosCarousel;
