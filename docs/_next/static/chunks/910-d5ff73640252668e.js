"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[910],{9910:function(e,n,t){t.d(n,{Z:function(){return W}});var r=t(28520),i=t.n(r),o=t(85893),a=t(4604),l=t(71230),s=t(15746),c=t(96486),u=t.n(c),d=t(67294),f=t(42336),p=t(41664),y=t(99490);function m(e){var n,t,r,i=e.note,a=e.noteIndex,l=(0,f.gt)({note:i,noteIndex:a});try{n=u().get(i,"custom.date",!1)?(t=i.custom.date,r=y.DateTime.DATE_SHORT,y.DateTime.fromISO(t).toLocaleString(r)):function(e,n){return y.DateTime.fromMillis(e).toLocaleString(n)}(i.created,y.DateTime.DATE_SHORT)}catch(s){throw Error("no date found for note ".concat(i.id))}return(0,o.jsx)("div",{children:(0,o.jsxs)("article",{itemScope:!0,itemType:"https://schema.org/CreativeWork",children:[(0,o.jsx)("h2",{itemProp:"headline",children:(0,o.jsx)(p.default,{href:l,children:i.title})}),!u().isUndefined(n)&&(0,o.jsx)("p",{children:n}),u().has(i,"custom.excerpt")&&(0,o.jsx)("p",{itemProp:"description",children:i.custom.excerpt})]})})}var g=t(9008),h=t(25935);function x(e){var n=e.content,t=(0,h.ZP)(n);return(0,o.jsx)(g.default,{children:t})}var v=t(25903),T=t(2962),j=t(1512),w=function(e){return v.Time.DateTime.fromMillis(u().toInteger(e)).setZone("utc").toLocaleString("yyyy-LL-dd")};function b(e){var n=e.note,t=e.config,r=(0,j.vm)().router.asPath;if(u().some(["403"],(function(e){return r==="/notes/".concat(e,"/")})))return null;var i,a=v.PublishUtils.getSEOPropsFromConfig(t),l=v.PublishUtils.getSEOPropsFromNote(n),s=u().defaults(l,a),c=s.title,d=s.excerpt,p=(null===s||void 0===s?void 0:s.image)?[s.image]:[],y=function(e){var n=e.sitePath,t=e.seoProps,r=e.siteConfig;return t.canonicalBaseUrl?[r.siteUrl,n].join(""):t.canonicalUrl?t.canonicalUrl:[r.canonicalBaseUrl?r.canonicalBaseUrl:(0,f.N0)(r),n].join("")}({sitePath:r,seoProps:s,siteConfig:t.site}),m=s.twitter?{handle:s.twitter,site:s.twitter,cardType:"summary_large_image"}:void 0;return(0,o.jsx)(T.PB,{title:c,description:d,canonical:y,noindex:s.noindex,twitter:m,openGraph:{title:c,description:d,url:y,images:p,type:"article",article:{publishedTime:w(s.created),modifiedTime:w(s.updated),tags:(i=n,i.tags?Array.isArray(i.tags)?i.tags:[i.tags]:[])}}})}var I=t(57450),E=t(37802);function P(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function k(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{},r=Object.keys(t);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(t).filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})))),r.forEach((function(n){P(e,n,t[n])}))}return e}function S(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}function B(e,n){return function(e){if(Array.isArray(e))return e}(e)||function(e,n){var t=[],r=!0,i=!1,o=void 0;try{for(var a,l=e[Symbol.iterator]();!(r=(a=l.next()).done)&&(t.push(a.value),!n||t.length!==n);r=!0);}catch(s){i=!0,o=s}finally{try{r||null==l.return||l.return()}finally{if(i)throw o}}return t}(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var L=E.Z.Link,D=function(e){e=(e=e.replace(/_/g,"-")).replace(/--/g,"-");var n=[];return e.split("-").forEach((function(e){n.push(e.substr(0,1).toUpperCase()+e.substr(1))})),n.join(" ")},O=function(e){var n,t,r=e.note,i=S(e,["note"]),a=(0,d.useState)(void 0),l=a[0],s=a[1];return(0,d.useEffect)((function(){s(window.innerHeight/2)}),[]),(0,o.jsx)(o.Fragment,{children:(0,o.jsxs)(E.Z,k({style:{zIndex:1},className:"dendron-toc"},i,{targetOffset:l,children:[Object.entries(null===r||void 0===r?void 0:r.anchors).map((function(e){var n,t,r=B(e,2),i=r[0],a=r[1];return"header"!==(null===a||void 0===a?void 0:a.type)?(0,o.jsx)(o.Fragment,{}):(null===a||void 0===a?void 0:a.depth)>2?(0,o.jsx)("div",{style:{paddingLeft:"20px"},children:(0,o.jsx)(L,{href:"#".concat(i),title:D(null!==(n=null===a||void 0===a?void 0:a.text)&&void 0!==n?n:null===a||void 0===a?void 0:a.value)})}):(0,o.jsx)("div",{children:(0,o.jsx)(L,{href:"#".concat(i),title:D(null!==(t=null===a||void 0===a?void 0:a.text)&&void 0!==t?t:null===a||void 0===a?void 0:a.value)})})})),(null===r||void 0===r||null===(n=r.links)||void 0===n?void 0:n.length)>0&&(null===r||void 0===r?void 0:r.links.some((function(e){return"backlink"===e.type})))?(0,o.jsx)(L,{href:"#backlinks",title:"Backlinks"}):(0,o.jsx)(o.Fragment,{}),(null===r||void 0===r||null===(t=r.children)||void 0===t?void 0:t.length)>0?(0,o.jsx)(L,{href:"#children",title:"Children"}):(0,o.jsx)(o.Fragment,{})]}))})},C=t(54856),M=t(85416),R=t(45875),Z=t(27049),A=t(53944),N=t(54811),F=R.b.LAYOUT,U=function(e){var n,t=(0,N.T)((function(e){return e.engine}));if(!(0,a.verifyEngineSliceState)(t))return null;var r=(0,f.N0)(t.config.site),i=e.note;if("w"===i.custom.status)return(0,o.jsxs)("span",{style:{fontSize:"14px",color:"lightgrey"},children:[(0,o.jsx)("span",{style:{display:"inline-block",width:"8px",height:"8px",backgroundColor:"pink",marginLeft:"10px",marginRight:"4px",borderRadius:"10px"}}),"pending notes (\u9019\u7bc7\u6587\u7ae0\u9084\u6c92\u5beb\u5b8c)"]});if(!i.id||"root"===i.id||"root"===i.parent||!0===(null===(n=i.custom)||void 0===n?void 0:n.stub)||"about"===i.id||"tags"===i.fname.split(".")[0]||"0drops"===i.fname.split(".")[0])return(0,o.jsx)(o.Fragment,{});var l={url:"".concat(r,"/notes/").concat(i.id),identifier:i.id,title:i.title};return(0,o.jsxs)(s.Z,{xs:24,md:18,children:[(0,o.jsx)(Z.Z,{dashed:!0}),(0,o.jsx)("div",{style:{paddingRight:"".concat(F.PADDING,"px")},children:(0,o.jsx)(A.qw,{shortname:"kiwijang",config:l})}),(0,o.jsx)(Z.Z,{dashed:!0})]})};function V(e,n,t,r,i,o,a){try{var l=e[o](a),s=l.value}catch(c){return void t(c)}l.done?n(s):Promise.resolve(s).then(r,i)}function H(e){return function(){var n=this,t=arguments;return new Promise((function(r,i){var o=e.apply(n,t);function a(e){V(o,r,i,a,l,"next",e)}function l(e){V(o,r,i,a,l,"throw",e)}a(void 0)}))}}function _(e,n){return function(e){if(Array.isArray(e))return e}(e)||function(e,n){var t=[],r=!0,i=!1,o=void 0;try{for(var a,l=e[Symbol.iterator]();!(r=(a=l.next()).done)&&(t.push(a.value),!n||t.length!==n);r=!0);}catch(s){i=!0,o=s}finally{try{r||null==l.return||l.return()}finally{if(i)throw o}}return t}(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var Y=R.b.LAYOUT,G=R.b.HEADER;function W(e){var n,t=e.note,r=e.body,c=e.collectionChildren,f=e.noteIndex,p=e.customHeadContent,y=e.config,g=e.rootBody,h=((0,a.createLogger)("Note"),(0,j.vm)().getActiveNoteId),v=_(d.useState(void 0),2),T=v[0],w=v[1],E=h(),P="";"root"===E&&(P=E,E=f.id);var k=(0,C.$s)();(0,C.O5)((function(e){return e.engine})),(0,j.dD)().isMobile;d.useEffect((function(){u().isUndefined(E)||(E!==t.id?fetch("/data/notes/".concat(E,".html")).then(H(i().mark((function e(n){var t;return i().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,n.text();case 2:t=e.sent,w(t),k(M.w.Nw.setLoadingStatus(a.LoadingStatus.FULFILLED));case 5:case"end":return e.stop()}}),e)})))):k(M.w.Nw.setLoadingStatus(a.LoadingStatus.FULFILLED)))}),[E]);var S=E===t.id?r:T;if(u().isUndefined(S))return(0,o.jsx)(I.Z,{});var B=(null===(n=t.custom)||void 0===n?void 0:n.has_collection)&&!u().isNull(c)?c.map((function(e){return m({note:e,noteIndex:f})})):null;if(E===P)return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(b,{note:t,config:y}),p&&(0,o.jsx)(x,{content:p}),(0,o.jsx)(l.Z,{children:(0,o.jsx)(s.Z,{span:24,children:(0,o.jsxs)(l.Z,{children:[(0,o.jsxs)(s.Z,{xs:24,md:18,children:[(0,o.jsx)("div",{style:{paddingRight:"".concat(Y.PADDING,"px")},children:(0,o.jsx)(a.DendronNote,{noteContent:g||"",config:y})}),B]}),(0,o.jsx)(s.Z,{xs:0,md:6,children:(0,o.jsx)(O,{note:t,offsetTop:G.HEIGHT})}),(0,o.jsx)(U,{note:t})]})})})]});if(E="about"){var L="\n    <script type=\"text/javascript\" id=\"www-widgetapi-script\" src=\"https://s.ytimg.com/yts/jsbin/www-widgetapi-vflS50iB-/www-widgetapi.js\" async=\"\"><\/script>\n    <script src=\"https://www.youtube.com/player_api\"><\/script>\n    <script>\n     try {\n      execute();\n  } catch(error) {\n    if (error instanceof ReferenceError) {\n      console.log(error)\n    } else {\n      console.log('Caught some other error.');\n    }\n  }\n\n  function execute() {\n    let player;\n    let duration = 0;\n    let currentTime = 0;\n    let isMuted = true;\n    let yt = null;\n    let isSetup = true;\n    let repeat = true;\n    let firstTime = true;    \n    let clock1 = null;\n    \n    if (window.location.href.split('/').includes('about')) {\n      document.addEventListener('DOMContentLoaded', (event) => {\n        console.log('goRepeat')\n        goRepeat();\n\n        if(document.getElementById('about')) {\n          \n          document.getElementById('bar-wrap').addEventListener('click',(e) => {\n            console.log('ccc')\n            const x = e.offsetX;\n            let seekToTime = 0;\n            const barWidth =  e.target.offsetWidth;\n            if (player) {\n              duration = player.getDuration();\n              seekToTime = Math.floor(x/barWidth*duration);\n              player.seekTo(seekToTime);\n            }        \n              \n            currentTime = yt? (yt.playerInfo? yt.playerInfo.currentTime : player.getCurrentTime()) : player.getCurrentTime();\n            document.getElementById('bar').style.width = String(currentTime / duration * 100)+'%';\n          });          \n              \n          if (firstTime) {\n            const updTimeLine = setInterval(() => {\n              console.log('upd')\n              if(!document.getElementById('bar')) {\n                clearInterval(updTimeLine);\n                return;\n              }\n              currentTime = yt? (yt.playerInfo? yt.playerInfo.currentTime : player.getCurrentTime()) : player.getCurrentTime();\n              document.getElementById('bar').style.width = String(currentTime / duration * 100)+'%';\n            }, 1000);\n\n            firstTime = false;\n          }\n        }\n        \n        window.stopVideo = stopVideo;\n        window.mute = mute;\n        window.unMute = unMute;\n        window.playMyVedio = playMyVedio;\n        window.pauseVideo = pauseVideo;\n        window.onYouTubePlayerAPIReady = onYouTubeIframeAPIReady;\n        window.onPlayerReady = onPlayerReady;\n      });    \n    }\n    \n    function goRepeat() {        \n      if (!document.getElementById('about')) { \n        repeat = true;         \n        clock1 = setInterval( ()=> {\n            if (isSetup) {\n              isSetup = false;\n              setup();\n            }\n            if (repeat) {\n              repeat = false;\n              goRepeat();\n            }\n        }, 500);\n        return;\n      } else {\n        if (clock1) {\n          clearInterval(clock1);\n        }\n\n        document.getElementById('bar-wrap').addEventListener('click',(e) => {\n          console.log('ccc')\n          const x = e.offsetX;\n          let seekToTime = 0;\n          const barWidth =  e.target.offsetWidth;\n          if (player) {\n            duration = player.getDuration();\n            seekToTime = Math.floor(x/barWidth*duration);\n            player.seekTo(seekToTime);\n          }        \n            \n          currentTime = yt? (yt.playerInfo? yt.playerInfo.currentTime : player.getCurrentTime()) : player.getCurrentTime();\n          document.getElementById('bar').style.width = String(currentTime / duration * 100)+'%';\n        });          \n            \n        if (firstTime) {\n          const updTimeLine = setInterval(() => {\n            console.log('upd')\n            if(!document.getElementById('bar')) {\n              clearInterval(updTimeLine);\n              return;\n            }\n            currentTime = yt? (yt.playerInfo? yt.playerInfo.currentTime : player.getCurrentTime()) : player.getCurrentTime();\n            document.getElementById('bar').style.width = String(currentTime / duration * 100)+'%';\n          }, 1000);\n\n          firstTime = false;\n        }\n      }\n    }\n\n    function setup() {          \n        if (typeof(YT) == 'undefined' || typeof(YT.Player) == 'undefined') {\n\n            // 2. This code loads the IFrame Player API code asynchronously.\n            const tag = document.createElement('script');    \n            tag.src = 'https://www.youtube.com/iframe_api';\n            const firstScriptTag = document.getElementsByTagName('script')[0];\n            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);\n\n        }\n\n        onYouTubeIframeAPIReady();\n    }\n\n    \n    // 3. This function creates an <iframe> (and YouTube player)\n    //    after the API code downloads.\n    function onYouTubeIframeAPIReady() {\n      yt = new YT.Player('player', {\n        height: '100',\n        width: '250',\n        videoId: 'GTlQhMRHXIg',\n        playerVars: {\n          autoplay: 0,\n          controls: 0,\n          loop: 1,\n          playsinline: 1,\n          origin: 'https://kiwijang.github.io',\n        },\n        events: {\n          onReady: onPlayerReady,\n        },\n      });\n    }\n\n    // 4. The API will call this function when the video player is ready.\n    function onPlayerReady(event) {\n      isMuted = event.target.isMuted();\n      if (isMuted) {\n        document.getElementById('btn-mute').style.display = 'none';\n        document.getElementById('btn-unMute').style.display = 'flex';\n      } else {\n        document.getElementById('btn-mute').style.display = 'flex';\n        document.getElementById('btn-unMute').style.display = 'none';\n      }\n\n      // event.target.playVideo();\n      player = event.target;\n      // console.log(player)\n\n      window.playMyVedio();\n      window.stopVideo();\n\n      duration = player.getDuration();\n\n      currentTime = yt? (yt.playerInfo? yt.playerInfo.currentTime : player.getCurrentTime()) : player.getCurrentTime();\n      document.getElementById('bar').style.width = String(currentTime/duration*100)+'%';   \n    }\n\n    function stopVideo() {\n      if (!player) return;\n      player.stopVideo();\n    }\n  \n    function pauseVideo() {\n      if (!player) return;\n      player.pauseVideo();\n    }\n  \n    function playMyVedio() {\n      if (!player) return;\n      player.playVideo();\n    }\n  \n    function unMute() {\n      checkIsMuted();\n    }\n  \n    function mute() {\n      checkIsMuted();\n    }\n  \n    function checkIsMuted() {\n      if (!player) return;\n  \n      if (document.getElementById('btn-mute').style.display !== 'flex') {\n        document.getElementById('btn-mute').style.display = 'flex';\n        document.getElementById('btn-unMute').style.display = 'none';\n        \n        player.unMute();\n      } else {\n        document.getElementById('btn-mute').style.display = 'none';\n        document.getElementById('btn-unMute').style.display = 'flex';\n        \n        player.mute();\n      }\n    }\n      \n  }\n  \n    <\/script>";return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(b,{note:t,config:y}),(0,o.jsx)(x,{content:L}),(0,o.jsx)(l.Z,{children:(0,o.jsx)(s.Z,{span:24,children:(0,o.jsxs)(l.Z,{children:[(0,o.jsxs)(s.Z,{xs:24,md:18,children:[(0,o.jsx)("div",{style:{paddingRight:"".concat(Y.PADDING,"px")},children:(0,o.jsx)(X,{children:(0,o.jsx)(a.DendronNote,{noteContent:S,config:y})})}),B]}),(0,o.jsx)(s.Z,{xs:0,md:6,children:(0,o.jsx)(O,{note:t,offsetTop:G.HEIGHT})}),(0,o.jsx)(U,{note:t})]})})})]})}return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(b,{note:t,config:y}),p&&(0,o.jsx)(x,{content:p}),(0,o.jsx)(l.Z,{children:(0,o.jsx)(s.Z,{span:24,children:(0,o.jsxs)(l.Z,{children:[(0,o.jsxs)(s.Z,{xs:24,md:18,children:[(0,o.jsx)("div",{style:{paddingRight:"".concat(Y.PADDING,"px")},children:(0,o.jsx)(a.DendronNote,{noteContent:S,config:y})}),B]}),(0,o.jsx)(s.Z,{xs:0,md:6,children:(0,o.jsx)(O,{note:t,offsetTop:G.HEIGHT})}),(0,o.jsx)(U,{note:t})]})})})]})}var X=function(e){var n=e.children,t=(0,d.useState)(!1),r=t[0],i=t[1];return(0,d.useEffect)((function(){i(!0)}),[]),(0,o.jsx)(o.Fragment,{children:r?n:null})}}}]);