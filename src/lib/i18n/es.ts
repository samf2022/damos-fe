// User-facing copy (Spanish, Venezuela). Keep every visible string here.
import type { CertificateStatus, CertificateTypeCode } from '#lib/types.ts';
import type { FormErrorCode } from '#lib/validation/form.ts';
import type {
	TemplatePlaceholder,
	TemplatePlaceholderGroup
} from '#lib/certificates/templatePlaceholders.ts';

export const es = {
	app: {
		name: 'Damos Fe',
		tagline: 'Constancias del consejo comunal'
	},
	nav: {
		home: 'Inicio',
		request: 'Solicitar constancia',
		admin: 'Administración'
	},
	public: {
		skipToContent: 'Saltar al contenido',
		metaDescription:
			'Solicita en línea tu constancia de residencia o de buena conducta del consejo comunal y recíbela por WhatsApp.',
		privacy: 'Tus datos solo los usa el consejo comunal para emitir tu constancia.',
		taxId: 'RIF'
	},
	home: {
		title: 'Solicita tu constancia en línea',
		description:
			'Sin filas ni papeles: llena el formulario desde tu teléfono y el consejo comunal te avisará por WhatsApp cuando tu constancia esté lista.',
		cta: 'Comenzar solicitud',
		ctaHint: 'Toma unos 3 minutos.',
		stepsTitle: 'Cómo funciona',
		steps: [
			{
				title: 'Llena el formulario',
				text: 'Con los datos de tu cédula, tu dirección y un teléfono con WhatsApp.'
			},
			{
				title: 'El consejo comunal revisa',
				text: 'Los voceros verifican tus datos y aprueban la constancia.'
			},
			{
				title: 'Recíbela por WhatsApp',
				text: 'Te enviamos la constancia en PDF, lista para imprimir.'
			}
		],
		needTitle: 'Ten a mano',
		needs: [
			'Tu cédula de identidad.',
			'Tu dirección: calle o avenida y número de casa.',
			'Un teléfono con WhatsApp.',
			'Cuánto tiempo llevas viviendo en la comunidad.'
		],
		typesTitle: 'Constancias disponibles',
		validity: 'Cada constancia tiene vigencia de {months} meses desde que se emite.',
		requestThis: 'Solicitar'
	},
	certificateTypeDescriptions: {
		residence: 'Certifica que vives en la comunidad. Se pide en trámites, inscripciones y bancos.',
		residence_conduct: 'Certifica tu residencia y tu buena conducta en un solo documento.',
		conduct: 'Certifica tu buena conducta en la comunidad.'
	} satisfies Record<CertificateTypeCode, string>,
	request: {
		title: 'Solicitud de constancia',
		certificateType: 'Tipo de constancia',
		resident: {
			nationalId: 'Cédula de identidad',
			nationalIdHint: 'Ejemplo: V-12345678',
			firstNames: 'Nombres',
			lastNames: 'Apellidos',
			gender: 'Sexo',
			maritalStatus: 'Estado civil',
			occupation: 'Ocupación',
			streetAddress: 'Calle o avenida',
			houseNumber: 'Número o nombre de casa',
			phone: 'Teléfono (WhatsApp)',
			phoneHint: 'Ejemplo: 0412-1234567'
		},
		knownSince: 'Tiempo viviendo en la comunidad',
		optional: '(opcional)',
		submit: 'Enviar solicitud',
		submitting: 'Enviando…',
		noTypes: 'Por ahora no hay tipos de constancia disponibles.',
		fixErrors: 'Revisa los campos marcados en rojo.',
		duplicatePending:
			'Ya tienes una solicitud pendiente de este tipo de constancia. Espera a que el consejo comunal la revise.',
		typeUnavailable: 'Ese tipo de constancia ya no está disponible. Selecciona otro.',
		tooManyRequests:
			'Recibimos demasiadas solicitudes desde tu conexión. Intenta de nuevo en una hora.',
		captchaFailed:
			'No pudimos comprobar que eres una persona. Espera a que aparezca la marca de verificación y vuelve a enviar.',
		captchaLabel: 'Verificación de seguridad',
		captchaUnavailable:
			'No se pudo cargar la verificación de seguridad. Revisa tu conexión a internet y recarga la página.',
		// Step-by-step form: one short topic per screen, plain questions and examples.
		wizard: {
			stepOf: 'Paso {n} de {total}',
			next: 'Continuar',
			back: 'Volver',
			backToReview: 'Guardar y volver a revisar',
			change: 'Cambiar',
			changeLabel: 'Cambiar {field}',
			stepErrors: 'Revisa lo que está marcado en rojo.',
			help: '¿Necesitas ayuda? Pide a alguien de confianza que te acompañe, o acércate al consejo comunal.',
			steps: {
				type: { title: '¿Qué constancia necesitas?', intro: 'Toca la que necesitas.' },
				identity: {
					title: '¿Quién eres?',
					intro: 'Escribe tus datos igual que en tu cédula de identidad.'
				},
				about: {
					title: 'Cuéntanos sobre ti',
					intro: 'Lo usamos para escribir bien tu constancia.'
				},
				home: { title: '¿Dónde vives?', intro: 'Tu dirección dentro de la comunidad.' },
				contact: {
					title: '¿A qué número te escribimos?',
					intro: 'Te avisaremos por WhatsApp cuando tu constancia esté lista.'
				},
				review: {
					title: 'Revisa tus datos',
					intro: 'Si algo está mal, toca «Cambiar». Si todo está bien, toca «Enviar solicitud».'
				}
			},
			fields: {
				nationalId: 'Número de cédula',
				nationalIdHint: 'Si eres venezolano, escribe solo los números. Ejemplo: 12345678',
				nationalIdForeign: '¿Eres extranjero? Escribe una E antes. Ejemplo: E-81234567',
				firstNames: 'Nombres',
				firstNamesHint: 'Ejemplo: María José',
				lastNames: 'Apellidos',
				lastNamesHint: 'Ejemplo: Pérez Rodríguez',
				gender: '¿Eres mujer u hombre?',
				genderOptions: { F: 'Mujer', M: 'Hombre' },
				maritalStatus: '¿Cuál es tu estado civil?',
				occupation: '¿A qué te dedicas?',
				occupationHint: 'Ejemplo: comerciante, estudiante, ama de casa. Puedes dejarlo en blanco.',
				streetAddress: 'Calle, avenida o vereda',
				streetAddressHint: 'Ejemplo: Calle Bolívar',
				houseNumber: 'Número o nombre de la casa',
				houseNumberHint: 'Ejemplo: 48, o Quinta Los Mangos. Puedes dejarlo en blanco.',
				knownSince: '¿Cuántos años tienes viviendo en la comunidad?',
				knownSinceHint: 'Escribe el número de años. Ejemplo: 5',
				phone: 'Teléfono con WhatsApp',
				phoneHint: 'Ejemplo: 0412-1234567'
			},
			/** Replaces "Este campo es obligatorio" with what to do, field by field. */
			required: {
				certificate_type_id: 'Toca la constancia que necesitas.',
				national_id: 'Escribe el número de tu cédula.',
				first_names: 'Escribe tus nombres.',
				last_names: 'Escribe tus apellidos.',
				gender: 'Toca «Mujer» u «Hombre».',
				marital_status: 'Toca tu estado civil.',
				street_address: 'Escribe la calle donde vives.',
				known_since_text: 'Escribe cuántos años tienes viviendo aquí.',
				phone: 'Escribe tu número de teléfono.'
			},
			notGiven: 'No indicado'
		}
	},
	requestSent: {
		title: '¡Solicitud enviada!',
		description: 'Recibimos tu solicitud. No necesitas hacer nada más por ahora.',
		nextTitle: '¿Qué sigue?',
		next: [
			'El consejo comunal revisará tus datos.',
			'Si falta algo, te contactaremos por WhatsApp.',
			'Cuando esté aprobada, te enviaremos la constancia en PDF por WhatsApp.'
		],
		another: 'Solicitar otra constancia',
		back: 'Volver al inicio'
	},
	verify: {
		title: 'Verificación de constancia',
		notFound: 'No encontramos ninguna constancia con este código.',
		holder: 'Titular',
		type: 'Tipo',
		status: 'Estado',
		issuedAt: 'Emitida el',
		expiresAt: 'Vigente hasta',
		valid: 'Constancia válida y vigente',
		validHint: 'Fue emitida por el consejo comunal y sigue vigente.',
		expired: 'Constancia vencida',
		expiredHint: 'Fue emitida por el consejo comunal, pero ya no está vigente.',
		notIssued: 'Esta constancia no ha sido emitida',
		notIssuedHint: 'La solicitud existe, pero el consejo comunal no la ha aprobado.',
		issuedBy: 'Emitida por',
		privacy: 'Por privacidad, aquí no se muestra la cédula ni otros datos del titular.'
	},
	gender: {
		F: 'Femenino',
		M: 'Masculino'
	},
	maritalStatus: {
		single: 'Soltero(a)',
		married: 'Casado(a)',
		divorced: 'Divorciado(a)',
		widowed: 'Viudo(a)',
		cohabiting: 'Unión estable de hecho'
	},
	certificateType: {
		residence: 'Constancia de residencia',
		residence_conduct: 'Constancia de residencia y buena conducta',
		conduct: 'Constancia de buena conducta'
	} satisfies Record<CertificateTypeCode, string>,
	certificateStatus: {
		pending: 'Pendiente',
		approved: 'Aprobada',
		rejected: 'Rechazada'
	} satisfies Record<CertificateStatus, string>,
	admin: {
		title: 'Panel administrativo',
		nav: {
			dashboard: 'Inicio',
			certificates: 'Solicitudes',
			residents: 'Residentes',
			signers: 'Firmantes',
			certificateTypes: 'Tipos de constancia',
			settings: 'Datos del consejo',
			users: 'Usuarios'
		},
		dashboard: {
			title: 'Resumen',
			sampleData: 'Todavía hay datos de ejemplo. Cámbialos antes de emitir constancias reales:',
			sampleCouncil: 'Datos del consejo',
			sampleSigners: 'Firmantes de ejemplo',
			turnstileOff:
				'La protección antispam (Cloudflare Turnstile) del formulario público no está activada. Solo se aplica el límite de solicitudes por conexión.',
			pending: 'Pendientes por revisar',
			approved: 'Aprobadas',
			rejected: 'Rechazadas'
		},
		certificates: {
			title: 'Solicitudes de constancias',
			detailTitle: 'Revisión de solicitud',
			empty: 'No hay solicitudes con estos filtros.',
			all: 'Todas',
			searchLabel: 'Buscar por cédula o nombre',
			searchPlaceholder: 'V-12345678 o María',
			search: 'Buscar',
			columns: {
				resident: 'Solicitante',
				type: 'Tipo',
				status: 'Estado',
				submittedAt: 'Enviada',
				serial: 'N.º'
			},
			previous: 'Anterior',
			next: 'Siguiente',
			back: '← Volver a solicitudes'
		},
		review: {
			submittedAt: 'Enviada el',
			submittedData: 'Datos enviados',
			residentRecord: 'Ficha actual',
			differs: 'Lo enviado difiere de la ficha del residente.',
			updateResident: 'Actualizar la ficha del residente con los datos enviados',
			editResident: 'Corregir datos del residente',
			inForceSameType:
				'Esta persona ya tiene una constancia vigente de este tipo: N.º {serial}, vence el {date}.',
			fields: {
				nationalId: 'Cédula',
				fullName: 'Nombre completo',
				gender: 'Sexo',
				maritalStatus: 'Estado civil',
				occupation: 'Ocupación',
				address: 'Dirección',
				phone: 'Teléfono'
			},
			preview: 'Vista previa del texto',
			previewNote: 'La fecha definitiva será la del momento de aprobar.',
			missing: 'Faltan datos para completar el texto:',
			knownSince: 'Tiempo viviendo en la comunidad',
			signers: 'Firmantes',
			signersHint:
				'Al menos dos. Por defecto, los asignados a este tipo de constancia, en el orden en que aparecerán.',
			approve: 'Aprobar y emitir',
			approving: 'Aprobando…',
			reject: 'Rechazar solicitud',
			rejecting: 'Rechazando…',
			rejectReason: 'Motivo del rechazo',
			rejectReasonHint: 'Se le podrá comunicar al solicitante.',
			approvedTitle: 'Constancia emitida',
			rejectedTitle: 'Solicitud rechazada',
			serialNumber: 'Número',
			verificationCode: 'Código de verificación',
			verificationLink: 'Enlace de verificación',
			issuedAt: 'Emitida el',
			expiresAt: 'Vence el',
			reviewedBy: 'Revisada por',
			reviewedAt: 'Revisada el',
			finalText: 'Texto emitido',
			document: {
				title: 'Documento',
				generating: 'Generando el PDF…',
				generate: 'Generar PDF',
				missing: 'El PDF todavía no se ha generado.',
				view: 'Ver o imprimir PDF',
				regenerate: 'Volver a generar PDF',
				regenerateHint:
					'Úsalo si cambiaste el logo o los datos del encabezado. El texto de la constancia no cambia.',
				whatsapp: 'Enviar por WhatsApp',
				whatsappDesktopHint:
					'En computadora se descarga el PDF y se abre el chat del solicitante: adjunta el archivo en WhatsApp.',
				whatsappNoPhone:
					'El solicitante no dejó teléfono: se descargará el PDF para enviarlo por otro medio.',
				whatsappSentAt: 'Enviado por WhatsApp el',
				message:
					'Hola, {name}. El {council} le envía su {type} N.º {serial}. Puede verificar su autenticidad en: {url}',
				errors: {
					generate: 'No se pudo generar el PDF. Intenta de nuevo.',
					not_found: 'La solicitud no existe.',
					not_approved: 'Solo se generan PDF de constancias aprobadas.',
					pdf_missing: 'No se recibió el PDF.',
					pdf_too_large: 'El PDF pesa demasiado.',
					pdf_invalid: 'El archivo generado no es un PDF válido.'
				}
			},
			errors: {
				not_found: 'La solicitud no existe.',
				already_reviewed: 'Esta solicitud ya fue revisada por otra persona. Recarga la página.',
				no_signers: 'Selecciona al menos dos firmantes: el texto está redactado en plural.',
				no_council: 'Faltan los datos del consejo comunal. Complétalos en «Datos del consejo».',
				template_incomplete: 'Faltan datos para completar el texto de la constancia.',
				reason_required: 'Escribe el motivo del rechazo (al menos 5 caracteres).',
				known_since_required: 'Indica el tiempo viviendo en la comunidad.'
			}
		},
		residents: {
			title: 'Residentes',
			description:
				'Personas que han pedido constancias. Corrige aquí sus datos para que las próximas constancias salgan bien.',
			searchLabel: 'Buscar residente',
			searchPlaceholder: 'Cédula o nombre',
			search: 'Buscar',
			empty: 'No hay residentes con esa búsqueda.',
			columns: {
				name: 'Nombre',
				nationalId: 'Cédula',
				phone: 'Teléfono',
				certificates: 'Constancias',
				lastRequest: 'Última solicitud'
			},
			previous: 'Anterior',
			next: 'Siguiente',
			pageOf: 'Página {page} de {pages}',
			back: 'Volver a residentes',
			backToRequest: 'Volver a la solicitud',
			dataTitle: 'Datos del residente',
			historyTitle: 'Constancias',
			noCertificates: 'Todavía no tiene constancias.',
			inForce: 'Vigente hasta',
			expired: 'Vencida',
			serial: 'N.º',
			submitted: 'Solicitada el',
			inForceSummary: 'Constancias vigentes:',
			applyToPending:
				'Aplicar también a sus {n} solicitudes pendientes (se emitirán con estos datos)',
			pendingHint:
				'Las constancias ya emitidas no cambian. Las solicitudes pendientes conservan los datos enviados, salvo que marques la casilla.',
			save: 'Guardar datos',
			saving: 'Guardando…',
			saved: 'Datos guardados.',
			savedWithPending: 'Datos guardados y aplicados a {n} solicitudes pendientes.',
			notFound: 'El residente no existe.'
		},
		signers: {
			title: 'Firmantes',
			description:
				'Voceros y voceras que firman las constancias. Las constancias ya emitidas conservan los firmantes que tenían.',
			add: 'Agregar firmante',
			newTitle: 'Nuevo firmante',
			editTitle: 'Editar firmante',
			back: '← Volver a firmantes',
			empty: 'Todavía no hay firmantes.',
			inactive: 'Inactivo',
			defaultFor: 'Firma por defecto',
			none: 'Ningún tipo',
			edit: 'Editar',
			deactivate: 'Desactivar',
			activate: 'Activar',
			fields: {
				fullName: 'Nombre completo',
				fullNameHint: 'Como aparece en la cédula. Va debajo de la firma.',
				shortName: 'Nombre corto',
				shortNameHint: 'Ejemplo: Ana Rodríguez',
				nationalId: 'Cédula',
				roleTitle: 'Cargo',
				roleTitleHint: 'Ejemplo: Voc. Finanzas',
				phone: 'Teléfono',
				gender: 'Sexo',
				genderHint: 'Define si el texto dice «Nosotras» o «Nosotros».',
				displayOrder: 'Orden en el documento',
				displayOrderHint: 'Los números menores aparecen primero.',
				certificateTypes: 'Firma por defecto en'
			},
			save: 'Guardar firmante',
			saved: 'Firmante guardado.',
			notFound: 'El firmante no existe.'
		},
		certificateTypes: {
			title: 'Tipos de constancia',
			description:
				'Título y redacción de cada constancia. Los cambios se aplican a las solicitudes que se aprueben desde ahora; las constancias ya emitidas no cambian.',
			active: 'Disponible',
			inactive: 'No disponible',
			edit: 'Editar',
			pendingCount: '{n} pendientes',
			updatedAt: 'Modificada el',
			back: 'Volver a tipos de constancia',
			editTitle: 'Editar tipo de constancia',
			fields: {
				title: 'Título',
				titleHint: 'Se imprime en mayúsculas sobre el texto.',
				body: 'Redacción',
				bodyHint:
					'Texto corrido, en un solo párrafo. Lo que va entre llaves dobles, como {{resident.fullName}}, se reemplaza por los datos reales al aprobar.',
				isActive: 'Disponible en el formulario público'
			},
			placeholders: 'Datos disponibles',
			placeholdersHint: 'Pulsa un dato para insertarlo donde está el cursor.',
			preview: 'Vista previa',
			previewHint: 'Con un residente de ejemplo, los datos del consejo y los firmantes actuales.',
			previewResident: 'Residente de ejemplo',
			previewPdf: 'Ver PDF de ejemplo',
			previewPdfError: 'No se pudo generar el PDF de ejemplo.',
			sampleSigners:
				'La vista previa usa firmantes ficticios porque hay menos de dos firmantes activos.',
			noCouncil: 'Configura primero los datos del consejo comunal para ver la vista previa.',
			emptyInPreview: 'Con los datos actuales quedarían vacíos:',
			restore: 'Restaurar redacción original',
			restoreConfirm:
				'¿Reemplazar el título y la redacción por los originales? No se guarda hasta que pulses «Guardar cambios».',
			pendingNotice:
				'Hay {n} solicitudes pendientes de este tipo: se emitirán con la redacción que guardes.',
			problems: {
				unknown: 'Estos datos no existen; revisa cómo están escritos:',
				missingRequired: 'Falta incluir:',
				strayBraces:
					'Hay llaves «{ }» sueltas. Cada dato va entre llaves dobles, por ejemplo {{resident.fullName}}.'
			},
			save: 'Guardar cambios',
			saving: 'Guardando…',
			saved: 'Cambios guardados.',
			notFound: 'El tipo de constancia no existe.',
			lastActive: 'Debe quedar al menos un tipo de constancia disponible en el formulario público.'
		},
		settings: {
			title: 'Datos del consejo comunal',
			description: 'Estos datos aparecen en el encabezado y en el texto de cada constancia.',
			sections: { council: 'Consejo comunal', location: 'Ubicación', validity: 'Vigencia' },
			fields: {
				name: 'Nombre del consejo comunal',
				taxId: 'RIF',
				taxIdHint: 'Ejemplo: J-12345678-9',
				state: 'Estado',
				municipality: 'Municipio',
				parish: 'Parroquia',
				placeNameHint: 'Solo el nombre: el texto ya antepone «Estado», «Municipio» o «Parroquia».',
				sectorAddress: 'Sector y dirección',
				sectorAddressHint:
					'Se lee después de «domiciliadas en …». Ejemplo: el Sector “9 de Abril”, vía Carúpano-San José',
				city: 'Ciudad o población',
				cityHint: 'Donde se expide: «Constancia que se expide en …».',
				validityMonths: 'Vigencia (meses)',
				validityNote: 'Nota de vigencia',
				validityNoteHint: 'Texto opcional al pie de la constancia.'
			},
			save: 'Guardar datos',
			saved: 'Datos guardados.',
			logo: {
				title: 'Logo o membrete',
				description:
					'Se imprime en el encabezado de cada constancia. Usa una imagen JPG o PNG; si es muy grande, se reduce automáticamente antes de subirla.',
				current: 'Logo actual',
				none: 'Todavía no hay logo.',
				choose: 'Imagen',
				upload: 'Subir logo',
				uploading: 'Subiendo…',
				remove: 'Quitar logo',
				uploaded: 'Logo actualizado.',
				removed: 'Logo eliminado.',
				resized: 'Imagen reducida de {from} a {to} antes de subirla.',
				errors: {
					logo_missing: 'Selecciona una imagen.',
					logo_too_large: 'La imagen pesa más de 2 MB.',
					logo_invalid_type: 'La imagen debe ser JPG o PNG.',
					no_council: 'Guarda primero los datos del consejo.'
				}
			}
		},
		users: { title: 'Usuarios administradores' },
		placeholder: 'Esta sección se construirá en el próximo hito.',
		signedInAs: 'Sesión iniciada como',
		logout: 'Cerrar sesión'
	},
	login: {
		title: 'Iniciar sesión',
		username: 'Usuario',
		password: 'Contraseña',
		submit: 'Entrar',
		invalidCredentials: 'Usuario o contraseña incorrectos.',
		missingFields: 'Ingresa tu usuario y contraseña.',
		tooManyAttempts:
			'Demasiados intentos fallidos. Por seguridad, espera {minutes} minutos e inténtalo de nuevo.'
	},
	form: {
		optional: '(opcional)'
	},
	templatePlaceholderGroups: {
		signers: 'Firmantes',
		resident: 'Residente',
		council: 'Consejo comunal',
		certificate: 'Constancia'
	} satisfies Record<TemplatePlaceholderGroup, string>,
	templatePlaceholders: {
		'signers.pronoun': '«Nosotras» o «Nosotros», según los firmantes',
		'signers.names': 'Nombres de los firmantes, en mayúsculas',
		'signers.nationalIds': 'Cédulas de los firmantes: «16.842.708, 4.935.094 y 5.880.762»',
		'signers.nationality': '«venezolanas» o «venezolanos»',
		'signers.domiciled': '«domiciliadas» o «domiciliados»',
		'signers.spokespersons': '«Voceras» o «Voceros»',
		'resident.fullName': 'Nombre completo del residente, en mayúsculas (obligatorio)',
		'resident.nationalId': 'Cédula con letra: «V-12345678»',
		'resident.nationalIdNumber': 'Cédula con puntos: «12.345.678»',
		'resident.nationality': '«venezolano», «venezolana», «extranjero» o «extranjera»',
		'resident.maritalStatus': 'Estado civil: «soltera», «casado»…',
		'resident.occupationPart': 'Ocupación con su coma («, costurera»); vacío si no la indicó',
		'resident.address': 'Dirección: «calle Los Pinos, casa N° 14»',
		'resident.domiciled': '«domiciliado» o «domiciliada»',
		'resident.toCitizen': '«al ciudadano» o «a la ciudadana»',
		'resident.aCitizen': '«un ciudadano» o «una ciudadana»',
		'resident.ofThem': '«de él» o «de ella»',
		'resident.article': '«el» o «la»',
		'resident.citizen': '«ciudadano» o «ciudadana»',
		'council.name': 'Nombre del consejo comunal',
		'council.sectorAddress': 'Sector y dirección del consejo comunal',
		'council.parish': 'Parroquia',
		'council.municipality': 'Municipio',
		'council.state': 'Estado',
		'council.city': 'Ciudad donde se expide',
		'certificate.knownSince': 'Tiempo en la comunidad: «más de 20 años»',
		'certificate.issuedOn':
			'Fecha en letras: «a los trece días del mes de julio de dos mil veintiséis»',
		'certificate.issuedAtWords': 'Fecha en letras, sin «a los»',
		'certificate.issuedDate': 'Fecha en números: «13-07-2026»'
	} satisfies Record<TemplatePlaceholder, string>,
	formErrors: {
		required: 'Este campo es obligatorio.',
		too_long: 'El texto es demasiado largo.',
		invalid_national_id: 'Escribe la cédula con su letra y números, por ejemplo V-12345678.',
		invalid_tax_id: 'Escribe el RIF con su letra y números, por ejemplo J-12345678-9.',
		invalid_name: 'Usa solo letras, espacios, apóstrofos o guiones.',
		invalid_option: 'Selecciona una opción de la lista.',
		invalid_phone: 'Escribe un teléfono venezolano válido, por ejemplo 0412-1234567.',
		invalid_number: 'Escribe un número válido.',
		duplicate_national_id: 'Ya existe otro residente con esta cédula.'
	} satisfies Record<FormErrorCode, string>,
	errors: {
		notFound: 'Página no encontrada',
		forbidden: 'No tienes permiso para ver esta página.',
		unauthorized: 'Debes iniciar sesión.',
		generic: 'Ocurrió un error inesperado. Intenta de nuevo.',
		backHome: 'Volver al inicio'
	}
} as const;
