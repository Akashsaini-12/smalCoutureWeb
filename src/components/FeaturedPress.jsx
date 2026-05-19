import React from "react";

const CUSTOM_CONTENT_CSS =
  "cdn/shop/t/10/assets/custom-content07f8.css?v=122562997671464857791739161087";

const customContentSections = [
  {
    id: "custom_content_xALaMf",
    sectionId: "m-custom-template--15265873625193__custom_content_xALaMf",
    className: "m-section m-custom-content m-gradient m-color-default",
    dataSectionType: "custom-content",
    dataSectionId: "template--15265873625193__custom_content_xALaMf",
    customStyle:
      " #shopify-section-template--15265873625193__custom_content_xALaMf .m-divider {height: 1px; width: 100%; background: rgb(var(--color-border));} ",
    blocks: [
      {
        id: "m-custom__block--html_gbT3c7",
        type: "divider",
        className:
          "m:column m:display-flex m-custom-content__block m-custom-content__block-html lg:m:w-full m:w-full",
      },
    ],
  },
  {
    id: "custom_content_f3reLw",
    sectionId: "shopify-section-template--15265873625193__custom_content_f3reLw",
    className: "shopify-section shopify-section-custom-content",
    stylesheetHref: CUSTOM_CONTENT_CSS,
    cssVars:
      "\n  #m-custom-template--15265873625193__custom_content_f3reLw {\n    --column-gap: 0px;\n    --column-gap-mobile: 16px;\n    --section-padding-top: 100px;\n    --section-padding-bottom: 100px;\n  }\n",
    blocks: [],
  },
];

const FeaturedPress = () => {
  return (
    <div>
      {customContentSections.map((section) => (
        <React.Fragment key={section.id}>
          <div
            id={section.sectionId}
            className={section.className}
            {...(section.dataSectionType && {
              "data-section-type": section.dataSectionType,
            })}
            {...(section.dataSectionId && {
              "data-section-id": section.dataSectionId,
            })}
          >
            {section.blocks.length > 0 ? (
              <div className="container-fluid m-section-my m-section-py m-custom-content__container">
                <div className="m-gradient m-color-default">
                  <div className="m-custom-content__wrapper m:flex m:flex-wrap">
                    {section.blocks.map((block) =>
                      block.type === "divider" ? (
                        <div
                          key={block.id}
                          id={block.id}
                          className={block.className}
                        >
                          <div className="m-custom-content__block-inner m:w-full">
                            <div className="m-divider" />
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            {section.stylesheetHref && (
              <link
                href={section.stylesheetHref}
                rel="stylesheet"
                type="text/css"
                media="all"
              />
            )}
            {section.cssVars && (
              <style
                dangerouslySetInnerHTML={{ __html: section.cssVars }}
              />
            )}
          </div>
          {section.customStyle && (
            <style
              dangerouslySetInnerHTML={{ __html: section.customStyle }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default FeaturedPress;
