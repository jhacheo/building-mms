# Stitch design update

The supplied Building Maintenance Management App design is the visual reference for the sapphire palette, Plus Jakarta Sans typography, pale canvas, rounded cards, property imagery, priority accents and mobile navigation. The existing Building MMS identity and tenant-scoped workflows remain in use.

Property cards show actual critical issues, active issues and asset totals. The supplied building images are labelled as illustrations. Work-order progress reflects the persisted pending, in-progress and resolved stages. The mockup's telemetry, AI, camera and checklist features are not presented as working features.

Fonts are self-hosted with their OFL license. Building images use Next.js image optimization and responsive sizes.

Validation: production build and ESLint pass. Browser checks with the existing confirmed test account cover persisted property records, mobile navigation, the report form and resolved work-order details at a 390px viewport. Dialog centering explicitly restores the native dialog margin reset by Tailwind.
