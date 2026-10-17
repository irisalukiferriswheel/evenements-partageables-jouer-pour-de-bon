import {useEffect,useRef,useState} from 'react';
import {initialLanguage,createLanguageController} from './jpdbLocalization.js';
export function useSiteLanguage(legacyKey='jpdb-language') {
  const [language,setLanguage]=useState(()=>initialLanguage(window,legacyKey));
  const controller=useRef(null);
  useEffect(()=>{
    controller.current=createLanguageController(window,setLanguage,legacyKey);
    return ()=>{controller.current?.destroy();controller.current=null;};
  },[legacyKey]);
  return [language,code=>controller.current?.choose(code)];
}
