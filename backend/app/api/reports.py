from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/survey/{survey_id}/pdf")
def get_survey_report_pdf(
    survey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download a PDF report for a single survey expedition.
    """
    try:
        pdf_bytes = report_service.generate_survey_report_pdf(survey_id, db)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=survey_report_{survey_id[:8]}.pdf"
            },
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF generation error: {exc}")


@router.get("/site/{site_id}/biodiversity/pdf")
def get_biodiversity_report_pdf(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download a comprehensive Biodiversity & Habitat Assessment PDF report for a monitoring site.
    """
    try:
        pdf_bytes = report_service.generate_biodiversity_report_pdf(site_id, db)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=biodiversity_report_{site_id[:8]}.pdf"
            },
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF generation error: {exc}")


@router.get("/detections/excel")
def get_detections_excel(
    site_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export raw detection records as an Excel spreadsheet (.xlsx).
    Supports optional site_id, date_from, date_to filtering.
    """
    try:
        excel_bytes = report_service.export_detections_excel(site_id, date_from, date_to, db)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=wildlife_detections_export.xlsx"
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Excel export error: {exc}")
