"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[910],{9910:function(e,t,n){n.d(t,{Z:function(){return G}});var r=n(28520),i=n.n(r),o=n(85893),a=n(4604),c=n(71230),l=n(15746),s=n(27049),u=n(96486),d=n.n(u),f=n(67294),v=n(42336),h=n(41664),p=n(99490);function x(e){var t,n,r,i=e.note,a=e.noteIndex,c=(0,v.gt)({note:i,noteIndex:a});try{t=d().get(i,"custom.date",!1)?(n=i.custom.date,r=p.DateTime.DATE_SHORT,p.DateTime.fromISO(n).toLocaleString(r)):function(e,t){return p.DateTime.fromMillis(e).toLocaleString(t)}(i.created,p.DateTime.DATE_SHORT)}catch(l){throw Error("no date found for note ".concat(i.id))}return(0,o.jsx)("div",{children:(0,o.jsxs)("article",{itemScope:!0,itemType:"https://schema.org/CreativeWork",children:[(0,o.jsx)("h2",{itemProp:"headline",children:(0,o.jsx)(h.default,{href:c,children:i.title})}),!d().isUndefined(t)&&(0,o.jsx)("p",{children:t}),d().has(i,"custom.excerpt")&&(0,o.jsx)("p",{itemProp:"description",children:i.custom.excerpt})]})})}var g=n(9008),m=n(25935);function y(e){var t=e.content,n=(0,m.ZP)(t);return(0,o.jsx)(g.default,{children:n})}var j=n(25903),b=n(2962),w=n(1512),O=function(e){return j.Time.DateTime.fromMillis(d().toInteger(e)).setZone("utc").toLocaleString("yyyy-LL-dd")};function S(e){var t=e.note,n=e.config,r=(0,w.vm)().router.asPath;if(d().some(["403"],(function(e){return r==="/notes/".concat(e,"/")})))return null;var i,a=j.PublishUtils.getSEOPropsFromConfig(n),c=j.PublishUtils.getSEOPropsFromNote(t),l=d().defaults(c,a),s=l.title,u=l.excerpt,f=(null===l||void 0===l?void 0:l.image)?[l.image]:[],h=function(e){var t=e.sitePath,n=e.seoProps,r=e.siteConfig;return n.canonicalBaseUrl?[r.siteUrl,t].join(""):n.canonicalUrl?n.canonicalUrl:[r.canonicalBaseUrl?r.canonicalBaseUrl:(0,v.N0)(r),t].join("")}({sitePath:r,seoProps:l,siteConfig:n.site}),p=l.twitter?{handle:l.twitter,site:l.twitter,cardType:"summary_large_image"}:void 0;return(0,o.jsx)(b.PB,{title:s,description:u,canonical:h,noindex:l.noindex,twitter:p,openGraph:{title:s,description:u,url:h,images:f,type:"article",article:{publishedTime:O(l.created),modifiedTime:O(l.updated),tags:(i=t,i.tags?Array.isArray(i.tags)?i.tags:[i.tags]:[])}}})}var P=n(57450),E=n(37802);function T(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function k(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})))),r.forEach((function(t){T(e,t,n[t])}))}return e}function L(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}function N(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=[],r=!0,i=!1,o=void 0;try{for(var a,c=e[Symbol.iterator]();!(r=(a=c.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(l){i=!0,o=l}finally{try{r||null==c.return||c.return()}finally{if(i)throw o}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var I=E.Z.Link,U=function(e){e=(e=e.replace(/_/g,"-")).replace(/--/g,"-");var t=[];return e.split("-").forEach((function(e){t.push(e.substr(0,1).toUpperCase()+e.substr(1))})),t.join(" ")},Z=function(e){var t,n,r=e.note,i=L(e,["note"]),a=(0,f.useState)(void 0),c=a[0],l=a[1];return(0,f.useEffect)((function(){l(window.innerHeight/2)}),[]),(0,o.jsx)(o.Fragment,{children:(0,o.jsxs)(E.Z,k({style:{zIndex:1},className:"dendron-toc"},i,{targetOffset:c,children:[Object.entries(null===r||void 0===r?void 0:r.anchors).map((function(e){var t,n,r=N(e,2),i=r[0],a=r[1];return"header"!==(null===a||void 0===a?void 0:a.type)?(0,o.jsx)(o.Fragment,{}):(null===a||void 0===a?void 0:a.depth)>2?(0,o.jsx)("div",{style:{paddingLeft:"20px"},children:(0,o.jsx)(I,{href:"#".concat(i),title:U(null!==(t=null===a||void 0===a?void 0:a.text)&&void 0!==t?t:null===a||void 0===a?void 0:a.value)})}):(0,o.jsx)("div",{children:(0,o.jsx)(I,{href:"#".concat(i),title:U(null!==(n=null===a||void 0===a?void 0:a.text)&&void 0!==n?n:null===a||void 0===a?void 0:a.value)})})})),(null===r||void 0===r||null===(t=r.links)||void 0===t?void 0:t.length)>0&&(null===r||void 0===r?void 0:r.links.some((function(e){return"backlink"===e.type})))?(0,o.jsx)(I,{href:"#backlinks",title:"Backlinks"}):(0,o.jsx)(o.Fragment,{}),(null===r||void 0===r||null===(n=r.children)||void 0===n?void 0:n.length)>0?(0,o.jsx)(I,{href:"#children",title:"Children"}):(0,o.jsx)(o.Fragment,{})]}))})},D=n(54856),F=n(85416),C=n(45875),A=n(53944),B=n(54811),_=function(e){var t=(0,B.T)((function(e){return e.engine}));if(!(0,a.verifyEngineSliceState)(t))return null;var n=(0,v.N0)(t.config.site),r=e.note;if(console.log(r),!r.id)return(0,o.jsx)(o.Fragment,{});var i={url:"".concat(n,"/notes/").concat(r.id),identifier:r.id,title:r.title};return(0,o.jsx)("div",{children:(0,o.jsx)(A.qw,{shortname:"kiwijang",config:i})})};function H(e,t,n,r,i,o,a){try{var c=e[o](a),l=c.value}catch(s){return void n(s)}c.done?t(l):Promise.resolve(l).then(r,i)}function M(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=[],r=!0,i=!1,o=void 0;try{for(var a,c=e[Symbol.iterator]();!(r=(a=c.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(l){i=!0,o=l}finally{try{r||null==c.return||c.return()}finally{if(i)throw o}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var R=C.b.HEADER;function G(e){var t,n=e.note,r=e.body,u=e.collectionChildren,v=e.noteIndex,h=e.customHeadContent,p=e.config,g=(0,a.createLogger)("Note"),m=(0,w.vm)().getActiveNoteId,j=M(f.useState(void 0),2),b=j[0],O=j[1],E=m();"root"===E&&(E=v.id);var T=(0,D.$s)();(0,D.O5)((function(e){return e.engine}));g.info({ctx:"enter",id:E});(0,w.dD)().isMobile;f.useEffect((function(){if(g.info({ctx:"updateNoteBody:enter",id:E}),d().isUndefined(E))g.info({ctx:"updateNoteBody:exit",id:E,state:"id undefined"});else{if(E===n.id)return T(F.w.Nw.setLoadingStatus(a.LoadingStatus.FULFILLED)),void g.info({ctx:"updateNoteBody:exit",id:E,state:"id = note.id"});var e;g.info({ctx:"updateNoteBody:fetch:pre",id:E}),fetch("/data/notes/".concat(E,".html")).then((e=i().mark((function e(t){var n;return i().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return g.info({ctx:"updateNoteBody:fetch:post",id:E}),e.next=3,t.text();case 3:n=e.sent,O(n),T(F.w.Nw.setLoadingStatus(a.LoadingStatus.FULFILLED));case 6:case"end":return e.stop()}}),e)})),function(){var t=this,n=arguments;return new Promise((function(r,i){var o=e.apply(t,n);function a(e){H(o,r,i,a,c,"next",e)}function c(e){H(o,r,i,a,c,"throw",e)}a(void 0)}))}))}}),[E]);var k=E===n.id?r:b;if(d().isUndefined(k))return(0,o.jsx)(P.Z,{});var L=(null===(t=n.custom)||void 0===t?void 0:t.has_collection)&&!d().isNull(u)?u.map((function(e){return x({note:e,noteIndex:v})})):null;return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(S,{note:n,config:p}),h&&(0,o.jsx)(y,{content:h}),(0,o.jsx)(c.Z,{children:(0,o.jsx)(l.Z,{span:24,children:(0,o.jsxs)(c.Z,{gutter:20,children:[(0,o.jsxs)(l.Z,{xs:24,md:18,children:[(0,o.jsx)(a.DendronNote,{noteContent:k,config:p}),L]}),(0,o.jsx)(l.Z,{xs:0,md:6,children:(0,o.jsx)(Z,{note:n,offsetTop:R.HEIGHT})}),(0,o.jsxs)(l.Z,{xs:24,md:18,children:[(0,o.jsx)(s.Z,{dashed:!0}),(0,o.jsx)(_,{note:n}),(0,o.jsx)(s.Z,{dashed:!0})]})]})})})]})}}}]);