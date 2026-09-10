"use strict";

// Source-text catalog: translate DOM text/attributes, never answer values or IDs.
window.SurveyI18n = (() => {
  const spanish = new Map(Object.entries({
    "Facade Perception Study": "Estudio de percepción de fachadas",
    "Language": "Idioma",
    "Questionnaire upload test": "Prueba de envío del cuestionario",
    "Technical test records must be removed from Netlify after verification.": "Los registros de prueba técnica deben eliminarse de Netlify después de su verificación.",
    "Technical test only. Use dummy ratings and do not enter personal information. This is not participant recruitment and there is no Prolific payment.": "Solo para pruebas técnicas. Utiliza valoraciones ficticias y no introduzcas información personal. No se están reclutando participantes ni se ofrece un pago de Prolific.",
    "You may stop this technical test at any time. Contact the research team using the email below about a submitted test record.": "Puedes detener esta prueba técnica en cualquier momento. Para consultar sobre un registro de prueba enviado, contacta con el equipo investigador mediante el correo indicado abajo.",
    "This test records dummy ratings, choices, checks, response times, language and recovery events, and browser and display information under a TEST identifier. It does not request Prolific identifiers or demographic data. Test records are excluded from the study analysis.": "Esta prueba registra valoraciones ficticias, elecciones, comprobaciones, tiempos de respuesta, idioma, eventos de recuperación e información del navegador y de la pantalla bajo un identificador TEST. No solicita identificadores de Prolific ni datos demográficos. Los registros de prueba se excluyen del análisis del estudio.",
    "After you consent, progress is saved in this browser. Clicking Send test responses at the end sends the complete test record to Netlify Forms. Earlier preview answers are not automatically uploaded. The researcher must verify and then remove technical test records from Netlify.": "Tras dar tu consentimiento, el progreso se guarda en este navegador. Al pulsar Enviar respuestas de prueba al final, se envía el registro completo de prueba a Netlify Forms. Las respuestas de vistas previas anteriores no se envían automáticamente. El investigador debe verificar y después eliminar los registros de prueba técnica de Netlify.",
    "Do you agree to send these technical test responses to Netlify?": "¿Aceptas enviar estas respuestas de prueba técnica a Netlify?",
    "Yes, I am 18 or older and agree to submit test responses.": "Sí, tengo 18 años o más y acepto enviar respuestas de prueba.",
    "Test record": "Registro de prueba",
    "Test record:": "Registro de prueba:",
    "No Prolific ID is needed for this technical test.": "No se necesita un identificador de Prolific para esta prueba técnica.",
    "Send test responses": "Enviar respuestas de prueba",
    "Test responses sent. Check Netlify Forms for this test record before treating the collector as verified. This is not a Prolific submission.": "Respuestas de prueba enviadas. Comprueba este registro en Netlify Forms antes de dar por verificado el sistema de recogida. Esto no es una participación en Prolific.",
    "The test upload was not confirmed. Download a backup and retry. Check that Netlify Forms detection is enabled and the site has been redeployed.": "No se ha confirmado el envío de prueba. Descarga una copia de seguridad y vuelve a intentarlo. Comprueba que la detección de formularios de Netlify esté activada y que se haya vuelto a desplegar el sitio.",
    "The upload test ended. No test responses have been sent.": "La prueba de envío ha finalizado. No se han enviado respuestas de prueba.",
    "Open the upload test on its configured HTTPS Netlify site.": "Abre la prueba de envío en el sitio HTTPS de Netlify configurado.",
    "approximately 10 years": "aproximadamente 10 años",
    "Facade perception survey": "Encuesta sobre la percepción de fachadas",
    "You will view 10 target facades with their surrounding street views. You will rate each facade on three scales and compare five pairs for overall preference.": "Verás 10 fachadas junto con imágenes de su entorno urbano. Valorarás cada fachada en tres escalas y compararás cinco pares según tu preferencia general.",
    "Data use and protection": "Uso y protección de los datos",
    "Ethics review": "Revisión ética",
    "Project reviewed:": "Proyecto evaluado:",
    "The UPC Ethics Committee has issued a favourable opinion on the ethical aspects related to the research carried out in this project/article.": "El Comité de Ética de la UPC ha emitido un dictamen favorable sobre los aspectos éticos relacionados con la investigación realizada en este proyecto/artículo.",
    "The current questionnaire and data-collection arrangements still require confirmation against the approved project scope. This preview is not open for participant recruitment.": "Aún debe confirmarse que el cuestionario actual y las modalidades de recogida de datos se ajustan al alcance del proyecto aprobado. Esta vista previa no está abierta al reclutamiento de participantes.",
    "The Universitat Politecnica de Catalunya - BarcelonaTech (UPC) is the data controller named in the research protocol for this academic study on visual perception of building facades. Processing is subject to the General Data Protection Regulation (EU) 2016/679 and Organic Law 3/2018.": "La Universitat Politècnica de Catalunya - BarcelonaTech (UPC) es la responsable del tratamiento indicada en el protocolo de esta investigación académica sobre la percepción visual de fachadas. El tratamiento está sujeto al Reglamento General de Protección de Datos (UE) 2016/679 y a la Ley Orgánica 3/2018.",
    "Taking part is voluntary. You may stop at any time by closing the survey. Contact the research team through Prolific if you wish to request withdrawal of an identifiable response before it is de-identified.": "La participación es voluntaria. Puedes interrumpirla en cualquier momento cerrando la encuesta. Contacta con el equipo investigador a través de Prolific si deseas solicitar la retirada de una respuesta identificable antes de su anonimización.",
    "The study records your Prolific participant, study and session identifiers; PAD ratings, pairwise choices and image-judgeability responses; comprehension and attention-check answers; response times; display language and recovery events; and browser, screen and viewport information. Selected demographic information will be supplied by Prolific. Your participant ID links these records and supports participation checks and payment.": "El estudio registra tus identificadores de participante, estudio y sesión de Prolific; las valoraciones PAD, las elecciones entre pares y las respuestas sobre si puedes valorar las imágenes; las respuestas a las comprobaciones de comprensión y atención; los tiempos de respuesta; el idioma de visualización y los eventos de recuperación; e información del navegador, la pantalla y el área visible de la página. Prolific proporcionará los datos demográficos seleccionados. Tu identificador de participante vincula estos registros y permite verificar la participación y gestionar el pago.",
    "Department of Architectural Technology (UPC)": "Departamento de Tecnología de la Arquitectura (UPC)",
    "Processing is based on your consent. You may withdraw consent by contacting the research team. You may request access, rectification, erasure, restriction of processing or data portability, and object to processing where applicable.": "El tratamiento se basa en tu consentimiento. Puedes retirarlo contactando con el equipo investigador. Puedes solicitar el acceso, la rectificación, la supresión, la limitación del tratamiento o la portabilidad de los datos, y oponerte al tratamiento cuando corresponda.",
    "The protocol specifies password-protected research storage managed by the department, with access limited to the research team and periodic backups. The collection service used by this questionnaire is described below.": "El protocolo establece un almacenamiento de investigación gestionado por el departamento y protegido mediante contraseña, con acceso limitado al equipo investigador y copias de seguridad periódicas. El servicio de recogida utilizado por este cuestionario se describe a continuación.",
    "The protocol separates coded research responses from identifying information for analysis. It provides for academic publications and open release of fully anonymized ratings and generalized profile data in CORA. Prolific IDs and linkage information will not be included in public datasets.": "El protocolo separa las respuestas codificadas de la información identificativa para el análisis. Prevé publicaciones académicas y la publicación en abierto en CORA de valoraciones y datos de perfil generalizados, completamente anonimizados. Los identificadores de Prolific y la información de vinculación no se incluirán en los conjuntos de datos públicos.",
    "UPC data retention policy": "Política de conservación de datos de la UPC",
    "UPC data protection rights and request procedure": "Derechos de protección de datos y procedimiento de solicitud de la UPC",
    "After you consent, a temporary copy of your progress and current selections is saved in this browser. Recovery expires 24 hours after your last activity; expired copies are removed when this survey is next opened. Reopening the same link in this browser before expiry can restore your progress. Clearing browser data or changing devices prevents recovery. You can delete the local copy using the button above.": "Tras dar tu consentimiento, se guarda en este navegador una copia temporal de tu progreso y de las opciones seleccionadas. La recuperación caduca 24 horas después de tu última actividad; las copias caducadas se eliminan al volver a abrir esta encuesta. Antes de que caduque, puedes recuperar el progreso abriendo el mismo enlace en este navegador. Borrar los datos del navegador o cambiar de dispositivo impide la recuperación. Puedes eliminar la copia local con el botón de arriba.",
    "Responses are submitted using Netlify Forms and exported to restricted research storage.": "Las respuestas se envían mediante Netlify Forms y se exportan a un almacenamiento de investigación con acceso restringido.",
    "This is a preview. Responses are not uploaded. After consent, they are temporarily stored in this browser so you can resume, and you may download a backup.": "Esta es una vista previa. Las respuestas no se envían. Tras el consentimiento, se guardan temporalmente en este navegador para que puedas continuar; también puedes descargar una copia de seguridad.",
    "Data protection enquiries:": "Consultas sobre protección de datos:",
    ". You may exercise applicable data protection rights and contact the": ". Puedes ejercer los derechos aplicables en materia de protección de datos y contactar con la",
    "Catalan Data Protection Authority": "Autoridad Catalana de Protección de Datos",
    "Consent": "Consentimiento",
    "Do you consent to take part in this study?": "¿Das tu consentimiento para participar en este estudio?",
    "Yes, I am 18 or older, I have read the information, and I consent to participate.": "Sí, tengo 18 años o más, he leído la información y doy mi consentimiento para participar.",
    "No, I do not consent.": "No, no doy mi consentimiento.",
    "Prolific ID": "Identificador de Prolific",
    "Your Prolific ID was provided by Prolific. Please confirm it below. Do not enter your name or email address.": "Prolific ha proporcionado tu identificador. Confírmalo a continuación. No introduzcas tu nombre ni tu correo electrónico.",
    "You can leave this blank for the preview. Do not enter your name or email address.": "Puedes dejar este campo vacío en la vista previa. No introduzcas tu nombre ni tu correo electrónico.",
    "Please enter your Prolific ID.": "Introduce tu identificador de Prolific.",
    "Instructions": "Instrucciones",
    "Evaluate the marked target facade as part of its visible street context. The other three images show the right, back and left views from the same location.": "Valora la fachada marcada como parte de su entorno urbano visible. Las otras tres imágenes muestran las vistas hacia la derecha, hacia atrás y hacia la izquierda desde el mismo punto.",
    "Consider adjacent buildings, street width, the ground-floor interface, vegetation and enclosure. Avoid basing your answer mainly on temporary elements such as cars or weather.": "Ten en cuenta los edificios contiguos, la anchura de la calle, la relación de la planta baja con la calle, la vegetación y el grado de cerramiento. Evita basar tu respuesta principalmente en elementos temporales como los coches o el tiempo atmosférico.",
    "Answer from your own immediate impression. There are no correct aesthetic answers. If you cannot judge a scene, select No in the final question; you do not need to invent a rating.": "Responde según tu impresión inmediata. No hay respuestas estéticas correctas. Si no puedes valorar una escena, selecciona No en la última pregunta; no es necesario que inventes una valoración.",
    "Understanding the task": "Comprensión de la tarea",
    "What should your evaluations focus on? You have two attempts.": "¿En qué deben centrarse tus valoraciones? Dispones de dos intentos.",
    "The marked target facade within its visible street context.": "La fachada marcada dentro de su entorno urbano visible.",
    "Only the sky and weather.": "Solo el cielo y el tiempo atmosférico.",
    "Only vehicles and temporary objects.": "Solo los vehículos y los objetos temporales.",
    "Only the technical quality of the photograph.": "Solo la calidad técnica de la fotografía.",
    "Please re-read the instructions above and try once more.": "Vuelve a leer las instrucciones anteriores e inténtalo una vez más.",
    "Individual facade ratings": "Valoración individual de fachadas",
    "Rate each of the 10 target facades on pleasure, arousal and dominance. Use the seven-point scales from -3 to +3, with 0 at the midpoint.": "Valora cada una de las 10 fachadas en agrado, activación y dominancia. Utiliza las escalas de siete puntos, de -3 a +3, con 0 en el punto medio.",
    "Here, arousal means visual stimulation. Dominance refers to perceived legibility, openness and sense of control within the street scene.": "Aquí, activación significa estimulación visual. Dominancia se refiere a la claridad percibida del entorno, su apertura y la sensación de control dentro de la escena urbana.",
    "Facade comparisons": "Comparación de fachadas",
    "For each of the five pairs, choose the target facade you prefer within its own street context. You may prefer them about equally.": "En cada uno de los cinco pares, elige la fachada que prefieras dentro de su propio entorno urbano. También puedes indicar que ambas te gustan aproximadamente por igual.",
    "Attention check": "Comprobación de atención",
    "This is an attention check. Please select Image B.": "Esta es una comprobación de atención. Selecciona Imagen B.",
    "This is an attention check. Please select No.": "Esta es una comprobación de atención. Selecciona No.",
    "Image A": "Imagen A",
    "Image B": "Imagen B",
    "About the same": "Aproximadamente igual",
    "End of task": "Fin de la tarea",
    "You have completed the questions.": "Has completado las preguntas.",
    "Save responses": "Guardar respuestas",
    "Finish preview": "Finalizar vista previa",
    "Continue": "Continuar",
    "Please select an option.": "Selecciona una opción.",
    "Location/context:": "Ubicación y contexto:",
    "Eixample, Barcelona, Catalonia, Spain.": "Eixample, Barcelona, Cataluña, España.",
    "Rate the marked target facade as part of the visible street scene.": "Valora la fachada marcada como parte de la escena urbana visible.",
    "Compare only the marked target facades as part of their visible street scenes.": "Compara únicamente las fachadas marcadas como parte de sus respectivas escenas urbanas visibles.",
    "Target facade": "Fachada a valorar",
    "Marked target facade": "Fachada marcada",
    "Marked main facade image A": "Fachada principal marcada, imagen A",
    "Marked main facade image B": "Fachada principal marcada, imagen B",
    "Street context images": "Imágenes del entorno urbano",
    "right": "derecha", "back": "atrás", "left": "izquierda",
    "Pleasure": "Agrado", "Arousal": "Activación", "Dominance": "Dominancia",
    "Pleasure: How pleasant does this target facade feel within its street context?": "Agrado: ¿Hasta qué punto te resulta agradable esta fachada dentro de su entorno urbano?",
    "Arousal: How visually stimulating does this target facade feel?": "Activación: ¿Hasta qué punto te resulta visualmente estimulante esta fachada?",
    "Dominance: How legible, open, and easy to feel in control does this facade context appear?": "Dominancia: ¿Hasta qué punto este entorno de fachada resulta comprensible y abierto, y transmite sensación de control?",
    "Very unpleasant": "Muy desagradable", "Very pleasant": "Muy agradable",
    "Very calm": "Muy tranquila", "Very stimulating": "Muy estimulante",
    "Very confusing/enclosed": "Muy confuso/cerrado", "Very legible/open": "Muy comprensible/abierto",
    "Neutral": "Neutral",
    "Were you able to rate this target facade clearly enough?": "¿Has podido valorar esta fachada con suficiente claridad?",
    "Were you able to compare these two target facades clearly enough?": "¿Has podido comparar estas dos fachadas con suficiente claridad?",
    "Overall preference: which target facade do you prefer as part of this street scene?": "Preferencia general: ¿qué fachada prefieres como parte de su entorno urbano?",
    "Strongly A": "Claramente A", "Slightly A": "Ligeramente A",
    "Slightly B": "Ligeramente B", "Strongly B": "Claramente B",
    "Yes": "Sí", "Somewhat": "En parte", "No": "No",
    "Please answer every row before continuing.": "Responde a todas las filas antes de continuar.",
    "Next image": "Siguiente imagen", "Next pair": "Siguiente par",
    "Loading images...": "Cargando imágenes...",
    "Some images could not load. Please retry before answering.": "No se han podido cargar algunas imágenes. Vuelve a intentarlo antes de responder.",
    "Retry images": "Volver a cargar imágenes",
    "Enlarge image": "Ampliar imagen", "Close enlarged image": "Cerrar imagen ampliada", "Close": "Cerrar",
    "Study ended": "Estudio finalizado",
    "You did not consent to participate. No response data has been uploaded. Please return the study on Prolific.": "No has dado tu consentimiento. No se han enviado respuestas. Devuelve el estudio en Prolific.",
    "Please close this survey and return your submission using Cancel participation on Prolific. No response data has been uploaded.": "Cierra esta encuesta y devuelve tu participación mediante Cancel participation en Prolific. No se han enviado respuestas.",
    "The task cannot run on this screen. Please contact the researcher through Prolific. No response data has been uploaded.": "La tarea no puede ejecutarse en esta pantalla. Contacta con el investigador a través de Prolific. No se han enviado respuestas.",
    "The study did not finish. No response data has been uploaded.": "El estudio no ha finalizado. No se han enviado respuestas.",
    "Thank you": "Gracias", "Saving responses": "Guardando respuestas",
    "This preview is complete. Responses have not been uploaded. You can download them to check the study design.": "La vista previa ha finalizado. Las respuestas no se han enviado. Puedes descargarlas para comprobar el diseño del estudio.",
    "Saving your responses. Please keep this page open.": "Guardando tus respuestas. Mantén esta página abierta.",
    "Your responses have been submitted. Please return to Prolific to complete the study.": "Tus respuestas se han enviado. Vuelve a Prolific para completar el estudio.",
    "Your responses could not be saved. Please retry. If the problem continues, contact the researcher through Prolific and submit with NOCODE so the technical issue can be reviewed.": "No se han podido guardar tus respuestas. Vuelve a intentarlo. Si el problema continúa, contacta con el investigador a través de Prolific y envía tu participación con NOCODE para que se pueda revisar la incidencia técnica.",
    "Download response backup": "Descargar copia de respuestas", "Download CSV": "Descargar CSV",
    "Retry saving": "Volver a guardar", "Return to Prolific": "Volver a Prolific",
    "Study unavailable": "Estudio no disponible",
    "Please contact the researcher through Prolific.": "Contacta con el investigador a través de Prolific.",
    "Study setup details": "Detalles de configuración del estudio",
    "To be confirmed before participant recruitment.": "Pendiente de confirmar antes de la captación de participantes.",
    "Download progress backup": "Descargar copia del progreso",
    "Delete local progress": "Eliminar progreso local",
    "Delete the saved progress for this session and start again?": "¿Quieres eliminar el progreso guardado de esta sesión y empezar de nuevo?",
    "Local progress saved. Responses are not yet submitted.": "Progreso guardado en este navegador. Las respuestas aún no se han enviado.",
    "Local backup unavailable. Keep this page open and download a progress backup before leaving.": "Copia local no disponible. Mantén la página abierta y descarga una copia del progreso antes de salir.",
    "This session changed in another tab. To avoid overwriting answers, close this tab and continue in the other one.": "Esta sesión ha cambiado en otra pestaña. Para evitar sobrescribir respuestas, cierra esta pestaña y continúa en la otra.",
    "Saved progress found": "Se ha encontrado progreso guardado",
    "Continue the saved session in this browser. Your previous answers and question order will be preserved.": "Continúa la sesión guardada en este navegador. Se conservarán tus respuestas anteriores y el orden de las preguntas.",
    "Resume session": "Continuar sesión", "Start again": "Empezar de nuevo",
    "Saved progress does not match this questionnaire. Download your backup and contact the researcher; it has not been overwritten.": "El progreso guardado no coincide con esta encuesta. Descarga tu copia y contacta con el investigador; no se ha sobrescrito.",
    "Use one tab": "Utiliza una sola pestaña",
    "This survey is already open in another tab. Close that tab, then try again here.": "Esta encuesta ya está abierta en otra pestaña. Ciérrala y vuelve a intentarlo aquí.",
    "Try again": "Volver a intentarlo",
    "Enlarge the window": "Amplía la ventana",
    "Please maximize this browser window or use a laptop or desktop computer, then try again. Your saved progress has not been deleted.": "Maximiza esta ventana del navegador o utiliza un ordenador portátil o de sobremesa y vuelve a intentarlo. No se ha eliminado tu progreso guardado."
  }));
  const catalan = new Map(Object.entries({
    "Facade Perception Study": "Estudi de percepció de façanes",
    "Language": "Idioma",
    "Questionnaire upload test": "Prova d'enviament del qüestionari",
    "Technical test records must be removed from Netlify after verification.": "Els registres de prova tècnica s'han d'eliminar de Netlify després de verificar-los.",
    "Technical test only. Use dummy ratings and do not enter personal information. This is not participant recruitment and there is no Prolific payment.": "Només per a proves tècniques. Utilitza valoracions fictícies i no introdueixis informació personal. No s'estan reclutant participants ni s'ofereix cap pagament de Prolific.",
    "You may stop this technical test at any time. Contact the research team using the email below about a submitted test record.": "Pots aturar aquesta prova tècnica en qualsevol moment. Per consultar sobre un registre de prova enviat, contacta amb l'equip investigador mitjançant el correu indicat a continuació.",
    "This test records dummy ratings, choices, checks, response times, language and recovery events, and browser and display information under a TEST identifier. It does not request Prolific identifiers or demographic data. Test records are excluded from the study analysis.": "Aquesta prova registra valoracions fictícies, eleccions, comprovacions, temps de resposta, idioma, esdeveniments de recuperació i informació del navegador i de la pantalla sota un identificador TEST. No sol·licita identificadors de Prolific ni dades demogràfiques. Els registres de prova s'exclouen de l'anàlisi de l'estudi.",
    "After you consent, progress is saved in this browser. Clicking Send test responses at the end sends the complete test record to Netlify Forms. Earlier preview answers are not automatically uploaded. The researcher must verify and then remove technical test records from Netlify.": "Després de donar el consentiment, el progrés es desa en aquest navegador. En prémer Envia respostes de prova al final, s'envia el registre complet de prova a Netlify Forms. Les respostes de vistes prèvies anteriors no s'envien automàticament. L'investigador ha de verificar i després eliminar els registres de prova tècnica de Netlify.",
    "Do you agree to send these technical test responses to Netlify?": "Acceptes enviar aquestes respostes de prova tècnica a Netlify?",
    "Yes, I am 18 or older and agree to submit test responses.": "Sí, tinc 18 anys o més i accepto enviar respostes de prova.",
    "Test record": "Registre de prova",
    "Test record:": "Registre de prova:",
    "No Prolific ID is needed for this technical test.": "No cal cap identificador de Prolific per a aquesta prova tècnica.",
    "Send test responses": "Envia respostes de prova",
    "Test responses sent. Check Netlify Forms for this test record before treating the collector as verified. This is not a Prolific submission.": "Respostes de prova enviades. Comprova aquest registre a Netlify Forms abans de donar per verificat el sistema de recollida. Això no és una participació a Prolific.",
    "The test upload was not confirmed. Download a backup and retry. Check that Netlify Forms detection is enabled and the site has been redeployed.": "No s'ha confirmat l'enviament de prova. Descarrega una còpia de seguretat i torna-ho a provar. Comprova que la detecció de formularis de Netlify estigui activada i que s'hagi tornat a desplegar el lloc.",
    "The upload test ended. No test responses have been sent.": "La prova d'enviament ha finalitzat. No s'han enviat respostes de prova.",
    "Open the upload test on its configured HTTPS Netlify site.": "Obre la prova d'enviament al lloc HTTPS de Netlify configurat.",
    "approximately 10 years": "aproximadament 10 anys",
    "Facade perception survey": "Enquesta sobre la percepció de façanes",
    "You will view 10 target facades with their surrounding street views. You will rate each facade on three scales and compare five pairs for overall preference.": "Veuràs 10 façanes juntament amb imatges del seu entorn urbà. Valoraràs cada façana en tres escales i compararàs cinc parelles segons la teva preferència general.",
    "Data use and protection": "Ús i protecció de les dades",
    "Ethics review": "Revisió ètica",
    "Project reviewed:": "Projecte avaluat:",
    "The UPC Ethics Committee has issued a favourable opinion on the ethical aspects related to the research carried out in this project/article.": "El Comitè d'Ètica de la UPC ha emès un dictamen favorable sobre els aspectes ètics relacionats amb la recerca realitzada en aquest projecte/article.",
    "The current questionnaire and data-collection arrangements still require confirmation against the approved project scope. This preview is not open for participant recruitment.": "Encara cal confirmar que el qüestionari actual i les modalitats de recollida de dades s'ajusten a l'abast del projecte aprovat. Aquesta vista prèvia no està oberta al reclutament de participants.",
    "The Universitat Politecnica de Catalunya - BarcelonaTech (UPC) is the data controller named in the research protocol for this academic study on visual perception of building facades. Processing is subject to the General Data Protection Regulation (EU) 2016/679 and Organic Law 3/2018.": "La Universitat Politècnica de Catalunya - BarcelonaTech (UPC) és la responsable del tractament indicada en el protocol d'aquesta recerca acadèmica sobre la percepció visual de façanes. El tractament està subjecte al Reglament general de protecció de dades (UE) 2016/679 i a la Llei orgànica 3/2018.",
    "Taking part is voluntary. You may stop at any time by closing the survey. Contact the research team through Prolific if you wish to request withdrawal of an identifiable response before it is de-identified.": "La participació és voluntària. Pots interrompre-la en qualsevol moment tancant l'enquesta. Contacta amb l'equip investigador a través de Prolific si vols sol·licitar la retirada d'una resposta identificable abans que es desidentifiqui.",
    "The study records your Prolific participant, study and session identifiers; PAD ratings, pairwise choices and image-judgeability responses; comprehension and attention-check answers; response times; display language and recovery events; and browser, screen and viewport information. Selected demographic information will be supplied by Prolific. Your participant ID links these records and supports participation checks and payment.": "L'estudi registra els teus identificadors de participant, estudi i sessió de Prolific; les valoracions PAD, les eleccions entre parelles i les respostes sobre si pots valorar les imatges; les respostes a les comprovacions de comprensió i atenció; els temps de resposta; l'idioma de visualització i els esdeveniments de recuperació; i informació del navegador, la pantalla i l'àrea visible de la pàgina. Prolific proporcionarà les dades demogràfiques seleccionades. El teu identificador de participant vincula aquests registres i permet verificar la participació i gestionar el pagament.",
    "Department of Architectural Technology (UPC)": "Departament de Tecnologia de l'Arquitectura (UPC)",
    "Processing is based on your consent. You may withdraw consent by contacting the research team. You may request access, rectification, erasure, restriction of processing or data portability, and object to processing where applicable.": "El tractament es basa en el teu consentiment. Pots retirar-lo contactant amb l'equip investigador. Pots sol·licitar l'accés, la rectificació, la supressió, la limitació del tractament o la portabilitat de les dades, i oposar-te al tractament quan correspongui.",
    "The protocol specifies password-protected research storage managed by the department, with access limited to the research team and periodic backups. The collection service used by this questionnaire is described below.": "El protocol estableix un emmagatzematge de recerca gestionat pel departament i protegit amb contrasenya, amb accés limitat a l'equip investigador i còpies de seguretat periòdiques. El servei de recollida utilitzat per aquest qüestionari es descriu a continuació.",
    "The protocol separates coded research responses from identifying information for analysis. It provides for academic publications and open release of fully anonymized ratings and generalized profile data in CORA. Prolific IDs and linkage information will not be included in public datasets.": "El protocol separa les respostes codificades de la informació identificativa per a l'anàlisi. Preveu publicacions acadèmiques i la publicació en obert a CORA de valoracions i dades de perfil generalitzades, completament anonimitzades. Els identificadors de Prolific i la informació de vinculació no s'inclouran en els conjunts de dades públics.",
    "UPC data retention policy": "Política de conservació de dades de la UPC",
    "UPC data protection rights and request procedure": "Drets de protecció de dades i procediment de sol·licitud de la UPC",
    "After you consent, a temporary copy of your progress and current selections is saved in this browser. Recovery expires 24 hours after your last activity; expired copies are removed when this survey is next opened. Reopening the same link in this browser before expiry can restore your progress. Clearing browser data or changing devices prevents recovery. You can delete the local copy using the button above.": "Després de donar el consentiment, es desa en aquest navegador una còpia temporal del teu progrés i de les opcions seleccionades. La recuperació caduca 24 hores després de la teva última activitat; les còpies caducades s'eliminen quan es torna a obrir aquesta enquesta. Abans que caduqui, pots recuperar el progrés obrint el mateix enllaç en aquest navegador. Esborrar les dades del navegador o canviar de dispositiu impedeix la recuperació. Pots eliminar la còpia local amb el botó de dalt.",
    "Responses are submitted using Netlify Forms and exported to restricted research storage.": "Les respostes s'envien mitjançant Netlify Forms i s'exporten a un emmagatzematge de recerca amb accés restringit.",
    "This is a preview. Responses are not uploaded. After consent, they are temporarily stored in this browser so you can resume, and you may download a backup.": "Aquesta és una vista prèvia. Les respostes no s'envien. Després del consentiment, es desen temporalment en aquest navegador perquè puguis continuar; també en pots descarregar una còpia de seguretat.",
    "Data protection enquiries:": "Consultes sobre protecció de dades:",
    ". You may exercise applicable data protection rights and contact the": ". Pots exercir els drets aplicables en matèria de protecció de dades i adreçar-te a:",
    "Catalan Data Protection Authority": "Autoritat Catalana de Protecció de Dades",
    "Consent": "Consentiment",
    "Do you consent to take part in this study?": "Dones el teu consentiment per participar en aquest estudi?",
    "Yes, I am 18 or older, I have read the information, and I consent to participate.": "Sí, tinc 18 anys o més, he llegit la informació i dono el meu consentiment per participar-hi.",
    "No, I do not consent.": "No, no dono el meu consentiment.",
    "Prolific ID": "Identificador de Prolific",
    "Your Prolific ID was provided by Prolific. Please confirm it below. Do not enter your name or email address.": "Prolific ha proporcionat el teu identificador. Confirma'l a continuació. No hi introdueixis el teu nom ni la teva adreça electrònica.",
    "You can leave this blank for the preview. Do not enter your name or email address.": "Pots deixar aquest camp en blanc a la vista prèvia. No hi introdueixis el teu nom ni la teva adreça electrònica.",
    "Please enter your Prolific ID.": "Introdueix el teu identificador de Prolific.",
    "Instructions": "Instruccions",
    "Evaluate the marked target facade as part of its visible street context. The other three images show the right, back and left views from the same location.": "Valora la façana marcada com a part del seu entorn urbà visible. Les altres tres imatges mostren les vistes cap a la dreta, cap enrere i cap a l'esquerra des del mateix punt.",
    "Consider adjacent buildings, street width, the ground-floor interface, vegetation and enclosure. Avoid basing your answer mainly on temporary elements such as cars or weather.": "Tingues en compte els edificis adjacents, l'amplada del carrer, la relació de la planta baixa amb el carrer, la vegetació i el grau de tancament. Evita basar la resposta principalment en elements temporals com els cotxes o les condicions meteorològiques.",
    "Answer from your own immediate impression. There are no correct aesthetic answers. If you cannot judge a scene, select No in the final question; you do not need to invent a rating.": "Respon segons la teva impressió immediata. No hi ha respostes estètiques correctes. Si no pots valorar una escena, selecciona No a l'última pregunta; no cal que inventis una valoració.",
    "Understanding the task": "Comprensió de la tasca",
    "What should your evaluations focus on? You have two attempts.": "En què s'han de centrar les teves valoracions? Disposes de dos intents.",
    "The marked target facade within its visible street context.": "La façana marcada dins del seu entorn urbà visible.",
    "Only the sky and weather.": "Només el cel i les condicions meteorològiques.",
    "Only vehicles and temporary objects.": "Només els vehicles i els objectes temporals.",
    "Only the technical quality of the photograph.": "Només la qualitat tècnica de la fotografia.",
    "Please re-read the instructions above and try once more.": "Torna a llegir les instruccions anteriors i prova-ho una vegada més.",
    "Individual facade ratings": "Valoració individual de façanes",
    "Rate each of the 10 target facades on pleasure, arousal and dominance. Use the seven-point scales from -3 to +3, with 0 at the midpoint.": "Valora cadascuna de les 10 façanes en plaer, activació i dominància. Utilitza les escales de set punts, de -3 a +3, amb el 0 al punt mitjà.",
    "Here, arousal means visual stimulation. Dominance refers to perceived legibility, openness and sense of control within the street scene.": "Aquí, activació significa estimulació visual. Dominància es refereix a la claredat percebuda de l'entorn, la seva obertura i la sensació de control dins de l'escena urbana.",
    "Facade comparisons": "Comparació de façanes",
    "For each of the five pairs, choose the target facade you prefer within its own street context. You may prefer them about equally.": "En cadascuna de les cinc parelles, tria la façana que prefereixis dins del seu propi entorn urbà. També pots indicar que totes dues t'agraden aproximadament igual.",
    "Attention check": "Comprovació d'atenció",
    "This is an attention check. Please select Image B.": "Aquesta és una comprovació d'atenció. Selecciona Imatge B.",
    "This is an attention check. Please select No.": "Aquesta és una comprovació d'atenció. Selecciona No.",
    "Image A": "Imatge A", "Image B": "Imatge B",
    "About the same": "Aproximadament igual",
    "End of task": "Fi de la tasca",
    "You have completed the questions.": "Has completat les preguntes.",
    "Save responses": "Desa les respostes",
    "Finish preview": "Finalitza la vista prèvia",
    "Continue": "Continua",
    "Please select an option.": "Selecciona una opció.",
    "Location/context:": "Ubicació i context:",
    "Eixample, Barcelona, Catalonia, Spain.": "Eixample, Barcelona, Catalunya, Espanya.",
    "Rate the marked target facade as part of the visible street scene.": "Valora la façana marcada com a part de l'escena urbana visible.",
    "Compare only the marked target facades as part of their visible street scenes.": "Compara únicament les façanes marcades com a part de les seves respectives escenes urbanes visibles.",
    "Target facade": "Façana a valorar",
    "Marked target facade": "Façana marcada",
    "Marked main facade image A": "Façana principal marcada, imatge A",
    "Marked main facade image B": "Façana principal marcada, imatge B",
    "Street context images": "Imatges de l'entorn urbà",
    "right": "dreta", "back": "enrere", "left": "esquerra",
    "Pleasure": "Plaer", "Arousal": "Activació", "Dominance": "Dominància",
    "Pleasure: How pleasant does this target facade feel within its street context?": "Plaer: fins a quin punt aquesta façana et resulta agradable dins del seu entorn urbà?",
    "Arousal: How visually stimulating does this target facade feel?": "Activació: fins a quin punt aquesta façana et resulta visualment estimulant?",
    "Dominance: How legible, open, and easy to feel in control does this facade context appear?": "Dominància: fins a quin punt l'entorn d'aquesta façana resulta comprensible i obert, i transmet una sensació de control?",
    "Very unpleasant": "Molt desagradable", "Very pleasant": "Molt agradable",
    "Very calm": "Molt tranquil·la", "Very stimulating": "Molt estimulant",
    "Very confusing/enclosed": "Molt confús/tancat", "Very legible/open": "Molt comprensible/obert",
    "Neutral": "Neutre",
    "Were you able to rate this target facade clearly enough?": "Has pogut valorar aquesta façana amb prou claredat?",
    "Were you able to compare these two target facades clearly enough?": "Has pogut comparar aquestes dues façanes amb prou claredat?",
    "Overall preference: which target facade do you prefer as part of this street scene?": "Preferència general: quina façana prefereixes com a part del seu entorn urbà?",
    "Strongly A": "Clarament A", "Slightly A": "Lleugerament A",
    "Slightly B": "Lleugerament B", "Strongly B": "Clarament B",
    "Yes": "Sí", "Somewhat": "En part", "No": "No",
    "Please answer every row before continuing.": "Respon totes les files abans de continuar.",
    "Next image": "Imatge següent", "Next pair": "Parella següent",
    "Loading images...": "S'estan carregant les imatges...",
    "Some images could not load. Please retry before answering.": "No s'han pogut carregar algunes imatges. Torna-ho a provar abans de respondre.",
    "Retry images": "Torna a carregar les imatges",
    "Enlarge image": "Amplia la imatge", "Close enlarged image": "Tanca la imatge ampliada", "Close": "Tanca",
    "Study ended": "Estudi finalitzat",
    "You did not consent to participate. No response data has been uploaded. Please return the study on Prolific.": "No has donat el consentiment per participar-hi. No s'han enviat respostes. Retorna l'estudi a Prolific.",
    "Please close this survey and return your submission using Cancel participation on Prolific. No response data has been uploaded.": "Tanca aquesta enquesta i retorna la teva participació mitjançant Cancel participation a Prolific. No s'han enviat respostes.",
    "The task cannot run on this screen. Please contact the researcher through Prolific. No response data has been uploaded.": "La tasca no es pot executar en aquesta pantalla. Contacta amb l'investigador a través de Prolific. No s'han enviat respostes.",
    "The study did not finish. No response data has been uploaded.": "L'estudi no ha finalitzat. No s'han enviat respostes.",
    "Thank you": "Gràcies", "Saving responses": "S'estan desant les respostes",
    "This preview is complete. Responses have not been uploaded. You can download them to check the study design.": "La vista prèvia ha finalitzat. Les respostes no s'han enviat. Pots descarregar-les per comprovar el disseny de l'estudi.",
    "Saving your responses. Please keep this page open.": "S'estan desant les teves respostes. Mantén aquesta pàgina oberta.",
    "Your responses have been submitted. Please return to Prolific to complete the study.": "Les teves respostes s'han enviat. Torna a Prolific per completar l'estudi.",
    "Your responses could not be saved. Please retry. If the problem continues, contact the researcher through Prolific and submit with NOCODE so the technical issue can be reviewed.": "No s'han pogut desar les teves respostes. Torna-ho a provar. Si el problema continua, contacta amb l'investigador a través de Prolific i envia la participació amb NOCODE perquè es pugui revisar la incidència tècnica.",
    "Download response backup": "Descarrega una còpia de les respostes", "Download CSV": "Descarrega el CSV",
    "Retry saving": "Torna a desar", "Return to Prolific": "Torna a Prolific",
    "Study unavailable": "Estudi no disponible",
    "Please contact the researcher through Prolific.": "Contacta amb l'investigador a través de Prolific.",
    "Study setup details": "Detalls de configuració de l'estudi",
    "To be confirmed before participant recruitment.": "Pendent de confirmar abans del reclutament de participants.",
    "Download progress backup": "Descarrega una còpia del progrés",
    "Delete local progress": "Elimina el progrés local",
    "Delete the saved progress for this session and start again?": "Vols eliminar el progrés desat d'aquesta sessió i tornar a començar?",
    "Local progress saved. Responses are not yet submitted.": "Progrés desat en aquest navegador. Les respostes encara no s'han enviat.",
    "Local backup unavailable. Keep this page open and download a progress backup before leaving.": "Còpia local no disponible. Mantén la pàgina oberta i descarrega una còpia del progrés abans de sortir.",
    "This session changed in another tab. To avoid overwriting answers, close this tab and continue in the other one.": "Aquesta sessió ha canviat en una altra pestanya. Per evitar sobreescriure respostes, tanca aquesta pestanya i continua a l'altra.",
    "Saved progress found": "S'ha trobat progrés desat",
    "Continue the saved session in this browser. Your previous answers and question order will be preserved.": "Continua la sessió desada en aquest navegador. Es conservaran les teves respostes anteriors i l'ordre de les preguntes.",
    "Resume session": "Reprèn la sessió", "Start again": "Torna a començar",
    "Saved progress does not match this questionnaire. Download your backup and contact the researcher; it has not been overwritten.": "El progrés desat no coincideix amb aquest qüestionari. Descarrega la còpia de seguretat i contacta amb l'investigador; no s'ha sobreescrit.",
    "Use one tab": "Utilitza una sola pestanya",
    "This survey is already open in another tab. Close that tab, then try again here.": "Aquesta enquesta ja està oberta en una altra pestanya. Tanca-la i torna-ho a provar aquí.",
    "Try again": "Torna-ho a provar",
    "Enlarge the window": "Amplia la finestra",
    "Please maximize this browser window or use a laptop or desktop computer, then try again. Your saved progress has not been deleted.": "Maximitza aquesta finestra del navegador o utilitza un ordinador portàtil o de sobretaula i torna-ho a provar. No s'ha eliminat el teu progrés desat."
  }));
  const languages = ["es", "ca", "en"];
  const requestedLanguage = new URLSearchParams(window.location.search).get("LANG");
  const explicitLanguage = languages.includes(requestedLanguage);
  const defaultLanguage = window.STUDY_CONFIG.participantLanguage;
  let language = explicitLanguage ? requestedLanguage : languages.includes(defaultLanguage) ? defaultLanguage : "es";
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const rendered = new WeakMap();
  const localized = (es, ca) => language === "ca" ? ca : es;
  const dynamic = [
    [/^Upload service response: HTTP (\d+)$/, (_, code) => `${localized("Respuesta del servicio de envío", "Resposta del servei d'enviament")}: HTTP ${code}`],
    [/^Responsible department: (.+)$/, (_, value) => `${localized("Departamento responsable", "Departament responsable")}: ${translate(value)}`],
    [/^Data-processing activity: (.+)$/, (_, value) => `${localized("Actividad de tratamiento de datos", "Activitat de tractament de dades")}: ${value}`],
    [/^PAD rating (\d+) of (\d+)$/, (_, n, total) => `${localized("Valoración PAD", "Valoració PAD")} ${n} de ${total}`],
    [/^Preference pair (\d+) of (\d+)$/, (_, n, total) => `${localized("Par de preferencia", "Parella de preferència")} ${n} de ${total}`],
    [/^Please use a laptop or desktop computer\. Estimated time: (.+) minutes\.$/, (_, time) => localized(`Utiliza un ordenador portátil o de sobremesa. Tiempo estimado: ${time} minutos.`, `Utilitza un ordinador portàtil o de sobretaula. Temps estimat: ${time} minuts.`)],
    [/^Retention period: (.+)$/, (_, value) => `${localized("Plazo de conservación", "Termini de conservació")}: ${translate(value)}`],
    [/^Research contact: (.+)$/, (_, value) => `${localized("Contacto del equipo investigador", "Contacte de l'equip investigador")}: ${translate(value)}`],
    [/^Ethics approval or exemption reference: (.+)$/, (_, value) => `${localized("Referencia de aprobación ética o exención", "Referència d'aprovació ètica o exempció")}: ${translate(value)}`],
    [/^Committee meeting date: (.+)$/, (_, value) => `${localized("Fecha de reunión del comité", "Data de reunió del comitè")}: ${value}`],
    [/^Signature date shown in the decision: (.+)$/, (_, value) => `${localized("Fecha de firma que figura en el dictamen", "Data de signatura que consta al dictamen")}: ${value}`],
    [/^Street context heading (\d+)$/, (_, value) => localized(`Vista del entorno urbano a ${value} grados`, `Vista de l'entorn urbà a ${value} graus`)],
    [/^Eixample, Barcelona, Catalonia, Spain\.\s+(.+)$/s, (_, rest) => `${translate("Eixample, Barcelona, Catalonia, Spain.")} ${translate(rest.trim())}`]
  ];
  function translate(text) {
    if (language === "en") return text;
    const catalog = language === "ca" ? catalan : spanish;
    if (catalog.has(text)) return catalog.get(text);
    for (const [pattern, replace] of dynamic) if (pattern.test(text)) return text.replace(pattern, replace);
    return text;
  }
  function localize(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest("script,style,textarea,[data-no-translate]")) continue;
      if (!originals.has(node) || (rendered.has(node) && node.nodeValue !== rendered.get(node))) originals.set(node, node.nodeValue);
      const source = originals.get(node);
      const translated = source.replace(/\S(?:[\s\S]*\S)?/, value => translate(value));
      if (node.nodeValue !== translated) node.nodeValue = translated;
      rendered.set(node, translated);
    }
    for (const element of root.querySelectorAll("[alt],[title],[aria-label],[placeholder]")) {
      if (element.closest("[data-no-translate]")) continue;
      const source = attributes.get(element) || {};
      for (const name of ["alt", "title", "aria-label", "placeholder"]) {
        if (!element.hasAttribute(name)) continue;
        if (!(name in source)) source[name] = element.getAttribute(name);
        const value = translate(source[name]);
        if (element.getAttribute(name) !== value) element.setAttribute(name, value);
      }
      attributes.set(element, source);
    }
    document.documentElement.lang = language;
    document.title = translate("Facade Perception Study");
  }
  function setLanguage(value, notify = true) {
    if (!languages.includes(value)) return;
    language = value;
    const select = document.querySelector("#survey-language");
    if (select) select.value = value;
    const url = new URL(window.location.href);
    url.searchParams.set("LANG", value);
    try { window.history.replaceState(null, "", url); } catch { /* Some file browsers restrict history. */ }
    localize();
    if (notify) document.dispatchEvent(new CustomEvent("survey-language-change", { detail: value }));
  }
  const observer = new MutationObserver(() => localize());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  document.querySelector("#survey-language").addEventListener("change", event => setLanguage(event.target.value));
  setLanguage(language, false);
  return { translate, localize, setLanguage, explicitLanguage, get language() { return language; } };
})();
