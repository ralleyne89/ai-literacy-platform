"use client"

import { TimelineContent } from '@/components/ui/timeline-animation'

function ClientFeedback() {
  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.4,
        duration: 0.5
      }
    }),
    hidden: {
      filter: 'blur(10px)',
      y: -20,
      opacity: 0
    }
  }

  return (
    <main className="w-full bg-white">
      <section className="relative container mx-auto h-full rounded-lg bg-white py-14 text-black">
        <article className="mx-auto max-w-screen-md space-y-2 text-center">
          <TimelineContent
            as="h1"
            className="text-3xl xl:text-4xl"
            animationNum={0}
            customVariants={revealVariants}
            style={{fontWeight: 700}}
          >
            What our customers think of the LitmusAI experience
          </TimelineContent>
          <TimelineContent
            as="p"
            className="mx-auto text-gray-500"
            animationNum={1}
            customVariants={revealVariants}
          >
            Hear how Litmus AI clients describe our impact on their upskilling journey.
          </TimelineContent>
        </article>

        <div className="flex w-full flex-col gap-2 px-4 pb-4 pt-10 lg:grid lg:grid-cols-3 lg:gap-2 lg:px-10 lg:py-10">
          <div className="flex h-full flex-col gap-2 md:flex lg:flex-col lg:gap-0 lg:space-y-2">
            <TimelineContent
              animationNum={0}
              customVariants={revealVariants}
              className="relative flex flex-[6] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white lg:flex-[7]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
              <article className="relative mt-auto space-y-4">
                <p className="text-sm leading-relaxed md:text-base">
                  LitmusAI has been a game-changer for us. Their service is top-notch and the team is incredibly responsive.”
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Guillermo Rauch</h2>
                    <p className="text-xs text-white/70 md:text-sm">CEO, Enigma</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=687&auto=format&fit=crop"
                    alt="Portrait of Guillermo Rauch"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={1}
              customVariants={revealVariants}
              className="flex flex-[4] flex-col justify-between rounded-lg border border-gray-200 bg-blue-600 p-5 text-white lg:flex-[3] lg:shrink-0 lg:h-fit"
            >
              <article className="mt-auto space-y-4">
                <p>
                  “We&apos;ve seen incredible results with LitmusAI. Their expertise and dedication keep us ahead.”
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Rika Shinoda</h2>
                    <p className="text-xs md:text-sm">CEO, Kintsugi</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=687&auto=format&fit=crop"
                    alt="Portrait of Rika Shinoda"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>

          <div className="flex h-full flex-col gap-2 md:flex lg:flex-col lg:gap-0 lg:space-y-2">
            <TimelineContent
              animationNum={2}
              customVariants={revealVariants}
              className="flex flex-col justify-between rounded-lg border border-gray-200 bg-[#111111] p-5 text-white"
            >
              <article className="mt-auto space-y-4">
                <p className="text-sm md:text-base">
                  “Their team is highly professional, and their innovative solutions have transformed the way we operate.”
                </p>
                <div className="flex items-end justify-between pt-2">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Reacher</h2>
                    <p className="text-xs text-white/70 md:text-sm">CEO, OdeaoLabs</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1021&auto=format&fit=crop"
                    alt="Portrait of Reacher"
                    className="h-12 w-12 rounded-xl object-cover md:h-16 md:w-16"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={3}
              customVariants={revealVariants}
              className="flex flex-col justify-between rounded-lg border border-gray-200 bg-[#111111] p-5 text-white"
            >
              <article className="mt-auto space-y-4">
                <p className="text-sm md:text-base">
                  “We&apos;re extremely satisfied with LitmusAI. Their expertise and dedication have exceeded expectations.”
                </p>
                <div className="flex items-end justify-between pt-2">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">John</h2>
                    <p className="text-xs text-white/70 md:text-sm">CEO, Labsbo</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=687&auto=format&fit=crop"
                    alt="Portrait of John"
                    className="h-12 w-12 rounded-xl object-cover md:h-16 md:w-16"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={4}
              customVariants={revealVariants}
              className="flex flex-col justify-between rounded-lg border border-gray-200 bg-[#111111] p-5 text-white"
            >
              <article className="mt-auto space-y-4">
                <p className="text-sm md:text-base">
                  “Their customer support is exceptional. They&apos;re always available, incredibly helpful, and proactive.”
                </p>
                <div className="flex items-end justify-between pt-2">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Steven Sunny</h2>
                    <p className="text-xs text-white/70 md:text-sm">CEO, Boxefi</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1740102074295-c13fae3e4f8a?q=80&w=687&auto=format&fit=crop"
                    alt="Portrait of Steven Sunny"
                    className="h-12 w-12 rounded-xl object-cover md:h-16 md:w-16"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>

          <div className="flex h-full flex-col gap-2 md:flex lg:flex-col lg:gap-0 lg:space-y-2">
            <TimelineContent
              animationNum={5}
              customVariants={revealVariants}
              className="flex flex-[4] flex-col justify-between rounded-lg border border-gray-200 bg-blue-600 p-5 text-white lg:flex-[3]"
            >
              <article className="mt-auto space-y-4">
                <p>LitmusAI has been a key partner in our growth journey.”</p>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Guillermo Rauch</h2>
                    <p className="text-xs md:text-sm">CEO, OdeaoLabs</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1563237023-b1e970526dcb?q=80&w=765&auto=format&fit=crop"
                    alt="Portrait of Guillermo Rauch"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>

            <TimelineContent
              animationNum={6}
              customVariants={revealVariants}
              className="relative flex flex-[6] flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white lg:flex-[7]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
              <article className="relative mt-auto space-y-4">
                <p>
                  LitmusAI has been a true game-changer for us. Their exceptional service and deep expertise have made a significant impact on our business.”
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold md:text-xl text-white">Paul Brauch</h2>
                    <p className="text-xs text-white/70 md:text-sm">CTO, Spectrum</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1590086782957-93c06ef21604?q=80&w=687&auto=format&fit=crop"
                    alt="Portrait of Paul Brauch"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
        </div>

        <div className="absolute bottom-4 z-[2] h-16 w-[90%] border-b-2 border-[#e6e6e6] left-[5%] md:left-0 md:w-full">
          <div className="relative mx-auto h-full w-full border-gray-300 before:absolute before:-left-2 before:-bottom-2 before:h-4 before:w-4 before:border before:border-gray-300 before:bg-white before:shadow-sm after:absolute after:-right-2 after:-bottom-2 after:h-4 after:w-4 after:border after:border-gray-300 after:bg-white after:shadow-sm" />
        </div>
      </section>
    </main>
  )
}

export default ClientFeedback
