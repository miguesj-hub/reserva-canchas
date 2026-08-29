# ===========================================================================
#  Compilación de la presentación.
#
#    make          -> presentacion.pdf        (la que se proyecta)
#    make notas    -> presentacion-notas.pdf  (con notas, para el ponente)
#    make watch    -> recompila al guardar
#    make clean    -> borra intermedios, conserva los PDF
#    make cleanall -> borra también los PDF
#
#  Se compila con lualatex: el tema metropolis usa fontspec y Fira Sans, que
#  pdflatex no sabe cargar.
# ===========================================================================

PRINCIPAL = presentacion
LATEXMK   = latexmk -lualatex -interaction=nonstopmode -halt-on-error

.PHONY: all notas watch clean cleanall

all:
	$(LATEXMK) $(PRINCIPAL).tex

# Compila una segunda copia con las notas del ponente al lado. Se hace en un
# jobname distinto para no pisar el PDF que va al proyector: si se proyecta
# por error la versión con notas, se ve el guion entero.
notas:
	$(LATEXMK) -jobname=$(PRINCIPAL)-notas \
	  -pretex="\def\connotas{}" -usepretex $(PRINCIPAL).tex

watch:
	$(LATEXMK) -pvc $(PRINCIPAL).tex

clean:
	$(LATEXMK) -c
	$(LATEXMK) -c -jobname=$(PRINCIPAL)-notas $(PRINCIPAL).tex

cleanall:
	$(LATEXMK) -C
	rm -f $(PRINCIPAL)-notas.pdf
