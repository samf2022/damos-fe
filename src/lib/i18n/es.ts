// User-facing copy (Spanish, Venezuela). Keep every visible string here.
import type { CertificateStatus, CertificateTypeCode } from '#lib/types.ts';
import type { FormErrorCode } from '#lib/validation/form.ts';

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
	home: {
		title: 'Solicita tu constancia',
		description:
			'Pide en línea tu constancia de residencia, de residencia y buena conducta o de buena conducta. El consejo comunal revisará tu solicitud y te avisará cuando esté lista.',
		cta: 'Comenzar solicitud'
	},
	request: {
		title: 'Solicitud de constancia',
		description: 'Completa tus datos tal como aparecen en tu cédula de identidad.',
		certificateType: 'Tipo de constancia',
		selectType: 'Selecciona un tipo',
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
		knownSinceHint: 'Ejemplo: más de 20 años',
		sections: {
			type: '¿Qué constancia necesitas?',
			personal: 'Datos personales',
			address: 'Dirección y contacto'
		},
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
			'No se pudo cargar la verificación de seguridad. Revisa tu conexión a internet y recarga la página.'
	},
	requestSent: {
		title: '¡Solicitud enviada!',
		description:
			'Recibimos tu solicitud. El consejo comunal la revisará y te contactará por WhatsApp cuando tu constancia esté lista.',
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
		expired: 'Constancia vencida',
		notIssued: 'Esta constancia no ha sido emitida'
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
		residents: { title: 'Residentes' },
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
		certificateTypes: { title: 'Tipos de constancia' },
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
	formErrors: {
		required: 'Este campo es obligatorio.',
		too_long: 'El texto es demasiado largo.',
		invalid_national_id: 'Escribe la cédula con su letra y números, por ejemplo V-12345678.',
		invalid_tax_id: 'Escribe el RIF con su letra y números, por ejemplo J-12345678-9.',
		invalid_name: 'Usa solo letras, espacios, apóstrofos o guiones.',
		invalid_option: 'Selecciona una opción de la lista.',
		invalid_phone: 'Escribe un teléfono venezolano válido, por ejemplo 0412-1234567.',
		invalid_number: 'Escribe un número válido.'
	} satisfies Record<FormErrorCode, string>,
	errors: {
		notFound: 'Página no encontrada',
		forbidden: 'No tienes permiso para ver esta página.',
		unauthorized: 'Debes iniciar sesión.',
		generic: 'Ocurrió un error inesperado. Intenta de nuevo.',
		backHome: 'Volver al inicio'
	}
} as const;
